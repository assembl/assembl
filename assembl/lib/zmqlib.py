import zmq
import zmq.devices

context = zmq.Context.instance()

td = zmq.devices.ThreadDevice(zmq.FORWARDER, zmq.XSUB, zmq.XPUB)
td.bind_in('inproc://assemblchanges')
td.bind_out('ipc:///tmp/assembl_changes/0')
td.setsockopt_in(zmq.IDENTITY, 'SUB')
#td.setsockopt_in(zmq.SUBSCRIBE, "")
td.setsockopt_out(zmq.IDENTITY, 'PUB')
td.start()
print "td:Started!"
