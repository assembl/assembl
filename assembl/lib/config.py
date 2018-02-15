""" Indirection layer to enable getting at the config while not littering the
codebase with thread-local access code. """

from pyramid.threadlocal import get_current_registry

_settings = None


def set_config(settings, reconfig=False):
    """ Set the settings object. """
    global _settings
    if _settings:
        if reconfig:
            _settings = settings
        else:
            _settings.update(settings)
            print "combined settings:", _settings
    else:
        _settings = settings
    return _settings


def get_config():
    """ Return the whole settings object. """
    global _settings
    return _settings or get_current_registry().settings


def get(name, default=None):
    """ Return a specific setting. """
    return get_config().get(name, default)
