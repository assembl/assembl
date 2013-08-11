import sys
import unittest
import logging
from pyramid import testing
from webtest import TestApp
from sqlalchemy.orm import scoped_session, sessionmaker
import assembl
from .plugins import add_parser_options
from optparse import OptionParser
from pyramid.paster import get_appsettings
from pkg_resources import get_distribution


class BaseTest(unittest.TestCase):
    """
    Inherit from BaseTest to have access to self.session to store /
    retrieve data, and to have access to self.app to make HTTP calls to the
    application.

    If drop_rows_before_test 
    """
    drop_rows_before_test = True

    def setUp(self):
        optparse = OptionParser()
        add_parser_options(optparse)
        options, args = optparse.parse_args(sys.argv)
        self.app_settings_file = options.test_settings_file
        self.app_settings = get_appsettings(
            self.app_settings_file)

        self.logger = logging.getLogger('assembl_tests')
        self.session = scoped_session(
            sessionmaker(self.app_settings))

        global_config = {
            '__file__': self.app_settings_file,
            'here': get_distribution('assembl').location
            }

        self.app = TestApp(assembl.main(
            global_config, **self.app_settings))

        testing.setUp(
            registry=self.app.app.registry,
            settings=self.app_settings,
        )
