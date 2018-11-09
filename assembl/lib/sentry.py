"""Abstract the existence and use of Sentry"""
from traceback import print_exc
import sentry_sdk

from assembl.lib.config import get


def is_sentry_enabled():
    return bool(get('sentry_dsn', ''))


def capture_message(*args, **kwargs):
    if is_sentry_enabled():
        sentry_sdk.capture_message(*args, **kwargs)


def capture_exception(*args, **kwargs):
    if is_sentry_enabled():
        sentry_sdk.capture_exception()
    else:
        print_exc()
