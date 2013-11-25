from os import mkdir
from os.path import exists

import zmq
import zmq.devices

if not exists("/tmp/assembl_changes"):
    mkdir("/tmp/assembl_changes")

context = zmq.Context.instance()

td = zmq.devices.ThreadDevice(zmq.FORWARDER, zmq.XSUB, zmq.XPUB)
td.bind_in('inproc://assemblchanges')
td.connect_out('ipc:///tmp/assembl_changes/0')
td.setsockopt_in(zmq.IDENTITY, 'XSUB')
#td.setsockopt_in(zmq.SUBSCRIBE, "")
td.setsockopt_out(zmq.IDENTITY, 'XPUB')
td.start()
print "td:Started!"
