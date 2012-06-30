""" Indirection layer to enable getting at the config while not littering the
codebase with thread-local access code. """

from pyramid.threadlocal import get_current_registry

_settings = None


def set_config(settings):
    """ Set the settings object. """
    global _settings
    _settings = settings


def get_config():
    """ Return the whole settings object. """
    return _settings or get_current_registry().settings


def get(name):
    """ Return a specific setting. """
    return get_config().get(name)
