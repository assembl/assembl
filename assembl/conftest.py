from pyramid.paster import get_appsettings

from .lib.sqla import (
    configure_engine, initialize_session_maker)
from .tests.utils import log
from .tests.pytest_fixtures import *


engine = None


def pytest_addoption(parser):
    parser.addoption(
        "--test-settings-file",
        action="store",
        default='testing.ini',
        dest="test_settings_file",
        help="Test INI file to be used during testing.")
    parser.addoption(
        "--logging-level",
        action="store",
        default='ERROR',
        dest="logging_level",
        help="Level of logging information.")


def pytest_configure(config):
    global engine
    log.setLevel(config.getoption('logging_level'))
    app_settings_file = config.getoption('test_settings_file')
    app_settings = get_appsettings(app_settings_file, 'assembl')
    # Make the unzopish sessionmaker the default
    configure_engine(app_settings, session_maker=initialize_session_maker(False))
    # Then load the other one
    configure_engine(app_settings, session_maker=initialize_session_maker(True))
    from .lib.zmqlib import configure_zmq
    configure_zmq(app_settings['changes.socket'],
                  app_settings['changes.multiplex'])
