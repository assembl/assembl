from itertools import count

import zmq
import zmq.devices

context = zmq.Context.instance()

INTERNAL_SOCKET = 'inproc://assemblchanges'
CHANGES_SOCKET = None
MULTIPLEX = True

_counter = count()


def start_dispatch_thread():
    td = zmq.devices.ThreadDevice(zmq.FORWARDER, zmq.XSUB, zmq.XPUB)
    td.bind_in(INTERNAL_SOCKET)
    td.connect_out(CHANGES_SOCKET)
    td.setsockopt_in(zmq.IDENTITY, 'XSUB')
    td.setsockopt_out(zmq.IDENTITY, 'XPUB')
    td.start()


def get_pub_socket():
    socket = context.socket(zmq.PUB)
    if MULTIPLEX:
        socket.connect(INTERNAL_SOCKET)
    else:
        socket.connect(CHANGES_SOCKET)
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
    if MULTIPLEX:
        start_dispatch_thread()


def includeme(config):
    settings = config.registry.settings
    configure_zmq(settings['changes.socket'],
                  settings['changes.multiplex'])
