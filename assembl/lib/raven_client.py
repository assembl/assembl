from traceback import print_exc
from raven.base import Raven


def get_raven_client():
    return Raven


def capture_message(*args, **kwargs):
    client = get_raven_client()
    if client:
        client.captureMessage(*args, **kwargs)


def capture_exception(*args, **kwargs):
    client = get_raven_client()
    if client:
        client.captureException(*args, **kwargs)
    else:
        print_exc()
