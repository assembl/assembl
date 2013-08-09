import sys
import unittest
import os
import logging
import transaction
from pkg_resources import get_distribution
from pyramid import testing
from pyramid.paster import (
    get_appsettings,
    )
from sqlalchemy import engine_from_config
from webtest import TestApp

import assembl
from assembl.db import DBSession


TEST_SETTINGS = 'testing.ini'
ASSEMBL_LOC = get_distribution('assembl').location
TEST_SETTINGS_LOC = os.path.join(ASSEMBL_LOC, TEST_SETTINGS)
SETTINGS = get_appsettings(TEST_SETTINGS_LOC)


DBSession.configure(bind=engine_from_config(
        SETTINGS, 'sqlalchemy.', echo=False))

def setUp():
    from assembl.lib.alembic import bootstrap_db
    sess = DBSession()
    BaseTest.drop_tables(DBSession.bind)
    bootstrap_db(TEST_SETTINGS_LOC, engine=sess.bind)


class BaseTest(unittest.TestCase):
    logger = logging.getLogger('testing')

    def setUp(self):
        self.session = DBSession()

        global_config = {
            '__file__': TEST_SETTINGS_LOC,
            'here': ASSEMBL_LOC,
            }

        self.app = TestApp(assembl.main(global_config, **SETTINGS))

        testing.setUp(
            registry=self.app.app.registry,
            settings=SETTINGS,
        )
        self.clear_rows(self.session.bind)
        

    @classmethod
    def get_all_tables(cls, conn):
        res = conn.execute(
            'SELECT table_schema,table_name FROM '
            'information_schema.tables WHERE table_schema = '
            '\'public\' ORDER BY table_schema,table_name')
        return res.fetchall()
        

    @classmethod
    def clear_rows(cls, conn):
        for row in cls.get_all_tables(conn):
            cls.logger.info("Clearing table: %s" % row[1])
            conn.execute("delete from \"%s\"" % row[1])

    @classmethod
    def drop_tables(cls, conn):
        try:
            for row in cls.get_all_tables(conn):
                cls.logger.info("dropping table: %s" % row[1])
                conn.execute("drop table \"%s\" cascade" % row[1]) 
        except:
            raise Exception('Error resetting database: %s' % (
                    sys.exc_info()[1]))

    def tearDown(self):
        transaction.commit()
        DBSession.flush()
        DBSession.close_all()
