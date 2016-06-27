"""Debugging functions triggered by posix signals"""
import code, traceback, signal
import threading, sys


def debug(sig, frame):
    """Interrupt running process, and provide a python prompt for
    interactive debugging."""
    d={'_frame':frame}         # Allow access to frame object.
    d.update(frame.f_globals)  # Unless shadowed by global
    d.update(frame.f_locals)

    i = code.InteractiveConsole(d)
    message  = "Signal received : entering python shell.\nTraceback:\n"
    message += ''.join(traceback.format_stack(frame))
    i.interact(message)


def dumpstacks(signal, frame):
    """Returns the traceback on all threads running Assembl"""
    id2name = dict([(th.ident, th.name) for th in threading.enumerate()])
    code = []
    for threadId, stack in sys._current_frames().items():
        code.append("\n# Thread: %s(%d)" % (id2name.get(threadId,""), threadId))
        for filename, lineno, name, line in traceback.extract_stack(stack):
            code.append('File: "%s", line %d, in %s' % (filename, lineno, name))
            if line:
                code.append("  %s" % (line.strip()))
    sys.stderr.write("\n".join(code)+"\n\n")


def listen():
    # Register handlers
    # Use SIGUSR1 signal in the process to dump the stack trace
    # this prods the process with: signal -usr1 ASSEMBL_PROCESS
    signal.signal(signal.SIGUSR1, dumpstacks)
    # This is useless within supervisor. Uncomment if needed.
    # signal.signal(signal.SIGUSR2, debug)
