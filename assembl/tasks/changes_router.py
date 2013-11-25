import signal
import time
from os import mkdir
from os.path import exists

import zmq
from zmq.eventloop import ioloop
from zmq.eventloop import zmqstream

from tornado import web
from sockjs.tornado import SockJSRouter, SockJSConnection
from tornado.httpserver import HTTPServer

# Inspired by socksproxy.

context = zmq.Context.instance()
ioloop.install()
io_loop = ioloop.IOLoop.instance()  # ZMQ loop

if not exists("/tmp/assembl_changes"):
    mkdir("/tmp/assembl_changes")

td = zmq.devices.ThreadDevice(zmq.FORWARDER, zmq.XSUB, zmq.XPUB)
td.bind_in('ipc:///tmp/assembl_changes/0')
td.bind_out('inproc://assemblchanges')
td.setsockopt_in(zmq.IDENTITY, 'XSUB')
#td.setsockopt_in(zmq.SUBSCRIBE, '')
td.setsockopt_out(zmq.IDENTITY, 'XPUB')
td.start()


class ZMQRouter(SockJSConnection):

    def on_open(self, request):
        self.valid = True

    def on_recv(self, data):
        self.send(data[-1])

    def on_message(self, msg):
        if msg.startswith('discussion:') and self.valid:
            discussion = msg.split(':', 1)[1]
            self.socket = context.socket(zmq.SUB)
            self.socket.connect('inproc://assemblchanges')
            self.socket.setsockopt(zmq.SUBSCRIBE, '*')
            self.socket.setsockopt(zmq.SUBSCRIBE, discussion)
            self.loop = zmqstream.ZMQStream(self.socket, io_loop=io_loop)
            self.loop.on_recv(self.on_recv)
            print "connected"

    def on_close(self):
        self.loop.stop_on_recv()
        self.socket.close()
        print "closing"

def logger(msg):
    print msg

def log_queue():
    socket = context.socket(zmq.SUB)
    socket.connect('inproc://assemblchanges')
    socket.setsockopt(zmq.SUBSCRIBE, '')
    loop = zmqstream.ZMQStream(socket, io_loop=io_loop)
    loop.on_recv(logger)

log_queue()

sockjs_router = SockJSRouter(ZMQRouter, io_loop=io_loop)
routes = sockjs_router.urls
web_app = web.Application(routes, debug=False)


def term(*_ignore):
    web_server.stop()
    io_loop.add_timeout(time.time() + 0.3, io_loop.stop)
    io_loop.start()  # Let the IO loop finish its work

signal.signal(signal.SIGTERM, term)

web_server = HTTPServer(web_app)
web_server.listen(8080)
try:
    io_loop.start()
except KeyboardInterrupt:
    term()
