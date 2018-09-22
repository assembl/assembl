"""ZMQ setup for the changes socket"""
import atexit
from itertools import count

import zmq
import zmq.devices
from time import sleep

context = zmq.Context.instance()

INTERNAL_SOCKET = 'inproc://assemblchanges'
CHANGES_SOCKET = None
MULTIPLEX = True
INITED = False
DISPATCHER = None

_counter = count()
_active_sockets = []


def start_dispatch_thread():
    global INITED, DISPATCHER
    if INITED:
        return
    DISPATCHER = zmq.devices.ThreadDevice(zmq.FORWARDER, zmq.XSUB, zmq.XPUB)
    DISPATCHER.bind_in(INTERNAL_SOCKET)
    DISPATCHER.connect_out(CHANGES_SOCKET)
    DISPATCHER.setsockopt_in(zmq.IDENTITY, 'XSUB')
    DISPATCHER.setsockopt_out(zmq.IDENTITY, 'XPUB')
    DISPATCHER.start()
    #Fix weird nosetests problems. TODO: find and fix underlying problem
    sleep(0.01)
    INITED = True


@atexit.register
def stop_sockets():
    #print "STOPPING SOCKETS"
    global CHANGES_SOCKET, MULTIPLEX, INITED, DISPATCHER
    for socket in _active_sockets:
        socket.close()
    INITED = False


def get_pub_socket():
    if MULTIPLEX:
        start_dispatch_thread()
    socket = context.socket(zmq.PUB)
    if MULTIPLEX:
        socket.connect(INTERNAL_SOCKET)
    else:
        socket.connect(CHANGES_SOCKET)
    _active_sockets.append(socket)
    # Related to "slow joiner" symptom
    # http://zguide.zeromq.org/page:all#Getting-the-Message-Out
    # It would be better to get the "ready" signal back but this is
    # adequate for now.
    sleep(0.2)
    return socket


def send_changes(socket, discussion, changeset):
    order = _counter.next()
    socket.send(discussion, zmq.SNDMORE)
    socket.send(str(order), zmq.SNDMORE)
    socket.send_json(changeset)
    print "sent", order, discussion, changeset


def configure_zmq(sockdef, multiplex):
    global CHANGES_SOCKET, MULTIPLEX
    assert isinstance(sockdef, str)
    CHANGES_SOCKET = sockdef
    MULTIPLEX = multiplex


def includeme(config):
    settings = config.registry.settings
    configure_zmq(settings['changes_socket'],
                  settings['changes_multiplex'])
