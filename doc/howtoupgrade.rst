How to upgrade to version with elasticsearch indexing
=====================================================

You need to run again::

    fab env_dev app_compile

to rebuild supervisord.conf

install elasticsearch with::

    fab env_dev install_elasticsearch

(If later you want to upgrade elasticsearch, modify the ELASTICSEARCH_VERSION
in `fabfile.py` and run the ``fab env_dev upgrade_elasticsearch`` command.)

Restart supervisor to read the new `supervisord.conf` config and start
elasticsearch::

    supervisorctl shutdown
    supervisord

You can show the stdout elasticsearch logs like this::

    supervisorctl tail -f elasticsearch

and stderr like this::

    supervisorctl tail -f elasticsearch stderr

To recreate the elasticsearch index from scratch (needed when you upgrade
assembl the first time or after you import a postgres dump)::

    assembl-reindex-all-contents local.ini

Elasticsearch listen on `127.0.0.1:9200`, example to get the elasticsearch
mapping::

    curl 127.0.0.1:9200/_mapping?pretty

