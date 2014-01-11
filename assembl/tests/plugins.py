import logging
import sys

from nose.plugins import Plugin
from pyramid.paster import get_appsettings
import transaction

from ..lib.migration import bootstrap_db
from ..lib.sqla import (configure_engine, get_session_maker,
                        get_metadata, is_zopish, mark_changed)

log = logging.getLogger('nose.plugins.assembl')


def add_parser_options(parser):
        parser.add_option(
            "--test-settings-file",
            action="store",
            default='testing.ini',
            dest="test_settings_file",
            help="Test INI file to be used during testing.")


def as_boolean(s):
    if isinstance(s, bool):
        return s
    return str(s).lower() in ['true', '1', 'on', 'yes']


class Assembl(Plugin):
    name = 'assembl-test-plugin'
    score = 100

    def options(self, parser, env):
        super(Assembl, self).options(parser, env)
        add_parser_options(parser)

    def get_all_tables(self, reversed=True):
        schema = self._app_settings.get('db_schema', 'assembl_test')
        # TODO: Quote schema name!
        res = self._session.execute(
            "SELECT table_name FROM "
            "information_schema.tables WHERE table_schema = "
            "'%s' ORDER BY table_name" % (schema,)).fetchall()
        res = {row[0] for row in res}
        # get the ordered version to minimize cascade.
        # cascade does not exist on virtuoso.
        import assembl.models
        ordered = [t.name for t in get_metadata().sorted_tables
                   if t.name in res]
        ordered.extend([t for t in res if t not in ordered])
        if reversed:
            ordered.reverse()
        log.debug('Current tables: %s' % str(ordered))
        return ordered

    def clear_rows(self):
        log.info('Clearing database rows.')
        for row in self.get_all_tables():
            # OR rebuild default permissions afterwards?
            # TODO: Separate table creation from base data fixture
            # in bootstrap_db
            if row in ('permission', 'role'):
                continue
            log.debug("Clearing table: %s" % row)
            self._session.execute("delete from \"%s\"" % row)
        self._session.commit()
        self._session.transaction.close()

    def drop_tables(self):
        log.info('Dropping all tables.')
        try:
            for row in self.get_all_tables():
                log.debug("Dropping table: %s" % row)
                self._session.execute("drop table \"%s\"" % row)
        except:
            raise Exception('Error dropping tables: %s' % (
                sys.exc_info()[1]))

    def configure(self, options, conf):
        log.setLevel(options.logcapture_level)

        super(Assembl, self).configure(options, conf)

        self._app_settings_file = options.test_settings_file
        self._app_settings = get_appsettings(self._app_settings_file)

        with_zope = as_boolean(self._app_settings.get('test_with_zope'))
        engine = configure_engine(self._app_settings, with_zope)

        self.session_factory = get_session_maker()
        assert with_zope == is_zopish(), "Session manager was not well "\
            "built. We recommend tracing assembl.lib.sqla.get_session_maker."

        transaction.begin()
        self._session = self.session_factory()

        self.drop_tables()

        log.info('Creating tables and running migrations.')
        bootstrap_db(options.test_settings_file, engine)
        transaction.commit()
        self._session = self.session_factory()

    def afterTest(self, test):
        self._session.rollback()
        self._session.transaction.close()
        if (hasattr(test, 'test')
                and getattr(test.test, 'drop_rows_before_test', False)):
            self.clear_rows()

    def finalize(self, result):
        self.session_factory.remove()
