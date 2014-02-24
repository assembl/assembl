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

def add_parser_options(parser):
        parser.add_option(
            "--test-settings-file",
            action="store",
            default='testing.ini',
            dest="test_settings_file",
            help="Test INI file to be used during testing.")

class Assembl(Plugin):
    name = 'assembl-test-plugin'
    score = 100

    def options(self, parser, env):
        super(Assembl, self).options(parser, env)
        add_parser_options(parser)

    def configure(self, options, conf):
        log.setLevel(options.logcapture_level)

        super(Assembl, self).configure(options, conf)

        app_settings_file = options.test_settings_file
        self._app_settings = get_appsettings(app_settings_file)
        self.session_factory = configure(app_settings_file, self._app_settings)
        self._session = self.session_factory()

    def afterTest(self, test):
        self._session.rollback()
        self._session.transaction.close()
        if (hasattr(test, 'test')
                and getattr(test.test, 'drop_rows_before_test', False)):
            clear_rows(self._app_settings, self._session)

    def finalize(self, result):
        self.session_factory.remove()
