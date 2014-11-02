import signal
import time
import sys
from os import makedirs
from os.path import exists, dirname
from ConfigParser import ConfigParser

import zmq
from zmq.eventloop import ioloop
from zmq.eventloop import zmqstream
import requests
from tornado import web
from sockjs.tornado import SockJSRouter, SockJSConnection
from tornado.httpserver import HTTPServer

from assembl.lib.zmqlib import INTERNAL_SOCKET
from assembl.lib.web_token import decode_token, TokenInvalid

# Inspired by socksproxy.

if len(sys.argv) != 2:
    print "usage: python changes_router.py configuration.ini"
    exit()


settings = ConfigParser({'changes.prefix': ''})
settings.read(sys.argv[-1])
CHANGES_SOCKET = settings.get('app:main', 'changes.socket')
CHANGES_PREFIX = settings.get('app:main', 'changes.prefix')
TOKEN_SECRET = settings.get('app:main', 'session.secret')
WEBSERVER_PORT = settings.getint('app:main', 'changes.websocket.port')
# NOTE: Not sure those are always what we want.
SERVER_HOST = settings.get('app:main', 'public_hostname')
SERVER_PORT = settings.getint('app:main', 'public_port')

context = zmq.Context.instance()
ioloop.install()
io_loop = ioloop.IOLoop.instance()  # ZMQ loop

if CHANGES_SOCKET.startswith('ipc://'):
    dir = dirname(CHANGES_SOCKET[6:])
    if not exists(dir):
        makedirs(dir)

td = zmq.devices.ThreadDevice(zmq.FORWARDER, zmq.XSUB, zmq.XPUB)
td.bind_in(CHANGES_SOCKET)
td.bind_out(INTERNAL_SOCKET)
td.setsockopt_in(zmq.IDENTITY, 'XSUB')
td.setsockopt_out(zmq.IDENTITY, 'XPUB')
td.start()


class ZMQRouter(SockJSConnection):

    token = None
    discussion = None

    def on_open(self, request):
        self.valid = True

    def on_recv(self, data):
        self.send(data[-1])

    def on_message(self, msg):
        if getattr(self, 'socket', None):
            print "closing old socket"
            self.loop.stop_on_recv()
            self.loop.close()
            self.socket = None
            self.loop = None
        if msg.startswith('discussion:') and self.valid:
            self.discussion = msg.split(':', 1)[1]
        if msg.startswith('token:') and self.valid:
            try:
                self.token = decode_token(msg.split(':', 1)[1], TOKEN_SECRET)
            except TokenInvalid:
                pass
        if self.token and self.discussion:
            # Check if token authorizes discussion
            r = requests.get(
                'http://%s:%d/api/v1/discussion/%s/permissions/read/u/%s' %
                (SERVER_HOST, SERVER_PORT, self.discussion,
                    self.token['userId']))
            print r.text
            if r.text != 'true':
                return
            self.socket = context.socket(zmq.SUB)
            self.socket.connect(INTERNAL_SOCKET)
            self.socket.setsockopt(zmq.SUBSCRIBE, '*')
            self.socket.setsockopt(zmq.SUBSCRIBE, str(self.discussion))
            self.loop = zmqstream.ZMQStream(self.socket, io_loop=io_loop)
            self.loop.on_recv(self.on_recv)
            print "connected"
            self.send('[{"@type":"Connection"}]')

    def on_close(self):
        self.loop.stop_on_recv()
        self.loop.close()
        self.socket = None
        self.loop = None
        print "closing"


def logger(msg):
    print msg


def log_queue():
    socket = context.socket(zmq.SUB)
    socket.connect(INTERNAL_SOCKET)
    socket.setsockopt(zmq.SUBSCRIBE, '')
    loop = zmqstream.ZMQStream(socket, io_loop=io_loop)
    loop.on_recv(logger)

log_queue()

sockjs_router = SockJSRouter(
    ZMQRouter, prefix=CHANGES_PREFIX, io_loop=io_loop)
routes = sockjs_router.urls
web_app = web.Application(routes, debug=False)


def term(*_ignore):
    web_server.stop()
    io_loop.add_timeout(time.time() + 0.3, io_loop.stop)
    io_loop.start()  # Let the IO loop finish its work

signal.signal(signal.SIGTERM, term)

web_server = HTTPServer(web_app)
web_server.listen(WEBSERVER_PORT)
try:
    io_loop.start()
except KeyboardInterrupt:
    term()
