from pyramid.paster import get_appsettings

from .lib.sqla import (
    configure_engine, initialize_session_maker)
from .lib import signals
from .lib.config import set_config
from .tests.utils import log

# Load all of the fixtures to be used by Assembl
from assembl.tests.fixtures.base import *  # noqa: F401
from assembl.tests.fixtures.auth import *  # noqa: F401
from assembl.tests.fixtures.discussion import *  # noqa: F401
from assembl.tests.fixtures.documents import *  # noqa: F401
from assembl.tests.fixtures.creativity_session import *  # noqa: F401
from assembl.tests.fixtures.graphql import *  # noqa: F401
from assembl.tests.fixtures.idea_content_links import *  # noqa: F401
from assembl.tests.fixtures.ideas import *  # noqa: F401
from assembl.tests.fixtures.langstring import *  # noqa: F401
from assembl.tests.fixtures.locale import *  # noqa: F401
from assembl.tests.fixtures.mailbox import *  # noqa: F401
from assembl.tests.fixtures.posts import *  # noqa: F401
from assembl.tests.fixtures.preferences import *  # noqa: F401
from assembl.tests.fixtures.resources import *  # noqa: F401
from assembl.tests.fixtures.user import *  # noqa: F401
from assembl.tests.fixtures.user_language_preference import *  # noqa: F401
from assembl.tests.fixtures.idea_message_columns import *  # noqa: F401
from assembl.tests.fixtures.sections import *  # noqa: F401
from assembl.tests.fixtures.timeline import *  # noqa: F401
from assembl.tests.fixtures.vote_session import *  # noqa: F401
from assembl.tests.fixtures.graphql_registry import *  # noqa: F401
from assembl.tests.fixtures.actions import *  # noqa: F401
from assembl.tests.fixtures.landing_page import *  # noqa: F401
from assembl.tests.fixtures.configurable_fields import *  # noqa: F401
from assembl.tests.fixtures.bright_mirror import *  # noqa: F401


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
    configure_engine(
        app_settings, session_maker=initialize_session_maker(False))
    from .lib.zmqlib import configure_zmq
    configure_zmq(app_settings['changes_socket'],
                  app_settings['changes_multiplex'])
    from assembl.indexing.changes import configure_indexing
    configure_indexing()
