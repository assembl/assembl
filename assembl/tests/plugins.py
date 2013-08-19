import logging
import sys
from nose.plugins import Plugin
from sqlalchemy import engine_from_config
from sqlalchemy.orm import scoped_session, sessionmaker
from pyramid.paster import get_appsettings
from assembl.lib.migration import bootstrap_db

log = logging.getLogger('nose.plugins.assembl')


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

    def get_all_tables(self):
        engine = self._session.bind

        res = engine.execute(
            'SELECT table_schema,table_name FROM '
            'information_schema.tables WHERE table_schema = '
            '\'public\' ORDER BY table_schema,table_name').fetchall()
        log.debug('Current tables: %s' % str(res))
        return res
        
    def clear_rows(self):
        engine = self._session.bind
        
        log.info('Clearing database rows.')

        for row in self.get_all_tables():
            log.debug("Clearing table: %s" % row[1])
            engine.execute("delete from \"%s\"" % row[1])

    def drop_tables(self):
        log.info('Dropping all tables.')
        engine = self._session.bind

        try:
            for row in self.get_all_tables():
                log.debug("Dropping table: %s" % row[1])
                engine.execute("drop table \"%s\" cascade" % row[1]) 
        except:
            raise Exception('Error dropping tables: %s' % (
                    sys.exc_info()[1]))

    def configure(self, options, conf):
        log.setLevel(options.logcapture_level)

        super(Assembl, self).configure(options, conf)

        self._app_settings_file = options.test_settings_file
        self._app_settings = get_appsettings(self._app_settings_file)

        self.session_factory = scoped_session(sessionmaker())
        self.session_factory.configure(bind=engine_from_config(
                self._app_settings,
                'sqlalchemy.',
                echo=False))

        self._session = self.session_factory()

        self.drop_tables()

        log.info('Creating tables and running migrations.')
        bootstrap_db(options.test_settings_file)

    def afterTest(self, test):
        if (hasattr(test, 'test')
            and getattr(test.test, 'drop_rows_before_test', False)):
            self.clear_rows()

    def finalize(self, result):
        self.session_factory.remove()
