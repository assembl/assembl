#!env python
import argparse

import requests
from sqlalchemy.exc import ProgrammingError

from ..lib.config import get
from ..lib.migration import bootstrap_db, bootstrap_db_data
from . import boostrap_configuration

from __future__ import print_function

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("configuration", help="configuration file")
    args = parser.parse_args()
    try:
        db = boostrap_configuration(args.configuration, False)
        assert list(db.execute('select count(id) from role'))[0][0] > 1
    except ProgrammingError as e:
        db.rollback()
        expected_message = 'relation "role" does not exist'
        if expected_message in e.orig.message:
            db = bootstrap_db(args.configuration)
            bootstrap_db_data(db)
        else:
            raise e
    assert list(db.execute('select count(id) from role'))[0][0] > 1
    elasticsearch_host = get('elasticsearch_host')
    elasticsearch_port = get('elasticsearch_port')
    elasticsearch_index = get('elasticsearch_index')
    elasticsearch_version = get('elasticsearch_version')
    elasticsearch_url = 'http://%s:%s' % (elasticsearch_host, elasticsearch_port)
    es_req = requests.get(elasticsearch_url)
    assert es_req.ok
    es_data = es_req.json()
    assert es_data['version']['number'] == elasticsearch_version
    assert es_data['cluster_name'] == elasticsearch_index
    print("success")


if __name__ == '__main__':
    main()
