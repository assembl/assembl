import logging
import sys

from pyramid.paster import get_appsettings
import transaction

from ..lib.sqla import configure_engine
from .plugins import as_boolean


engine = None


def pytest_addoption(parser):
        parser.addoption(
            "--test-settings-file",
            action="store",
            default='testing.ini',
            dest="test_settings_file",
            help="Test INI file to be used during testing.")


def pytest_configure(config):
    #log.setLevel(options.logcapture_level)
    global engine
    app_settings_file = config.getoption('test_settings_file')
    app_settings = get_appsettings(app_settings_file)
    with_zope = as_boolean(app_settings.get('test_with_zope'))
    engine = configure_engine(app_settings, with_zope)
