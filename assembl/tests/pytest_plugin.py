import logging
import sys

from nose.plugins import Plugin
from pyramid.paster import get_appsettings
import transaction

from ..lib.migration import bootstrap_db
from ..lib.sqla import (configure_engine, get_session_maker,
                        get_metadata, is_zopish, mark_changed)
from .plugins import (
    log, as_boolean, get_all_tables, clear_rows, drop_tables, configure)

def pytest_addoption(parser):
        parser.addoption(
            "--test-settings-file",
            action="store",
            default='testing.ini',
            dest="test_settings_file",
            help="Test INI file to be used during testing.")

app_settings = None
session_factory = None

def pytest_configure(config):
    #log.setLevel(options.logcapture_level)
    global app_settings, session_factory
    app_settings_file = config.getoption('test_settings_file')
    app_settings = get_appsettings(app_settings_file)
    session_factory = configure(app_settings_file, app_settings)

def pytest_runtest_teardown(item):
    global app_settings, session_factory
    session = session_factory()
    session.rollback()
    session.transaction.close()
    if (hasattr(item, 'test')
            and getattr(item.test, 'drop_rows_before_test', False)):
        clear_rows(app_settings, session)


def finalize(self, result):
    global session_factory
    session_factory.remove()
