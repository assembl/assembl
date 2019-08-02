"""Analyze semantically all posts. This script requires the discussions to have preferences semantic analysis and translation activated"""
import sys
import logging.config
import argparse

from pyramid.paster import get_appsettings
import requests
import transaction

from assembl.lib.sqla import (
    configure_engine, get_session_maker)
from assembl.lib.zmqlib import configure_zmq
from assembl.lib.config import set_config
from assembl.indexing.changes import configure_indexing

from assembl.lib.migration import semantic_analyze_all_posts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("configuration", help="configuration file")
    parser.add_argument("-d", "--discussion", help="id of discussion")
    args = parser.parse_args()
    settings = get_appsettings(args.configuration, 'assembl')
    set_config(settings)
    configure_engine(settings, True)
    session = get_session_maker()()
    semantic_analyze_all_posts(session, args.discussion)

if __name__ == '__main__':
    main()