"""Add the section to all discussions that hasn't been initialized with it"""
import sys
import logging.config

from pyramid.paster import get_appsettings
import requests
import transaction

from assembl.lib.sqla import (
    configure_engine, get_session_maker)
from assembl.lib.zmqlib import configure_zmq
from assembl.lib.config import set_config
from assembl.indexing.changes import configure_indexing

from assembl.lib.migration import add_semantic_analysis_tab_to_all_discussions


def main():
    config_fname = sys.argv[1]
    settings = get_appsettings(config_fname, 'assembl')
    set_config(settings)
    logging.config.fileConfig(config_fname)
    configure_zmq(settings['changes_socket'], False)
    configure_engine(settings, True)
    session = get_session_maker()()
    add_semantic_analysis_tab_to_all_discussions(session)


if __name__ == '__main__':
    main()
