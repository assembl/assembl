import psycopg2
import sys
import unittest
import os
from pkg_resources import get_distribution
from pyramid import testing
from pyramid.paster import (
    get_appsettings,
    )
from sqlalchemy import engine_from_config
from webtest import TestApp
import assembl


TEST_SETTINGS = 'testing.ini'
ASSEMBL_LOC = get_distribution('assembl').location
TEST_SETTINGS_LOC = os.path.join(ASSEMBL_LOC, TEST_SETTINGS)
SETTINGS = get_appsettings(TEST_SETTINGS_LOC)


def setUp():
    engine = engine_from_config(SETTINGS, 'sqlalchemy.')
    global_config = {
        '__file__': TEST_SETTINGS_LOC,
        'here': ASSEMBL_LOC,
    }
    # app = TestApp(assembl.main(global_config, **SETTINGS))
    # testing.setUp(
    #     registry=app.app.registry,
    #     settings=SETTINGS,
    # )
    ApiTest.reset_database(SETTINGS, engine)
    from assembl.lib.alembic import bootstrap_db
    bootstrap_db(TEST_SETTINGS_LOC)


class ApiTest(unittest.TestCase):

    def setUp(self):
        # Reset database
        pass


    @classmethod
    def reset_database(cls, settings, engine):
        try:
            cur.execute("SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_schema,table_name")
            rows = cur.fetchall()
            for row in rows:
                print "dropping table: ", row[1]
                engine.execute("drop table \"%s\" cascade" % row[1]) 
        except:
            print "Error: ", sys.exc_info()[1]
            
        # import pdb; pdb.set_trace()
        

    def test_poo(self):
        self.assertTrue(True)

    def test_pee(self):
        self.assertTrue(True)


