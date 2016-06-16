from pyramid.paster import get_appsettings

from .lib.sqla import (
    configure_engine, initialize_session_maker)
from .lib import signals
from .lib.config import set_config
from .tests.utils import log

# Load all of the fixtures to be used by Assembl
from .tests.fixtures.base import *
from .tests.fixtures.auth import *
from .tests.fixtures.discussion import *
from .tests.fixtures.creativity_session import *
from .tests.fixtures.idea_content_links import *
from .tests.fixtures.ideas import *
from .tests.fixtures.langstring import *
from .tests.fixtures.locale import *
from .tests.fixtures.mailbox import *
from .tests.fixtures.posts import *
from .tests.fixtures.preferences import *
from .tests.fixtures.user import *
from .tests.fixtures.user_language_preference import *


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
    # Listen to kill process command for debug purposes
    signals.listen()
    log.setLevel(config.getoption('logging_level'))
    app_settings_file = config.getoption('test_settings_file')
    app_settings = get_appsettings(app_settings_file, 'assembl')
    set_config(app_settings)
    # Use an unzopish sessionmaker
    configure_engine(app_settings, session_maker=initialize_session_maker(False))
    from .lib.zmqlib import configure_zmq
    configure_zmq(app_settings['changes.socket'],
                  app_settings['changes.multiplex'])
