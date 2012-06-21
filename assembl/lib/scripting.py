""" Helper functions for scripts. """

import sys


def exitonbreak(target):
    """ Cleanly exit on CTRL-C. """
    def wrapper():
        try:
            target()
        except KeyboardInterrupt as e:
            sys.stderr.write('\nTrapped a Break. Exiting.\n')
            sys.exit(1)
    return wrapper
