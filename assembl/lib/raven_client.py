def get_raven_client():
    from raven.base import Raven
    return Raven


def capture_message(*args, **kwargs):
    client = get_raven_client()
    if client:
        client.captureMessage(*args, **kwargs)


def capture_exception(*args, **kwargs):
    client = get_raven_client()
    if client:
        client.captureException(*args, **kwargs)
