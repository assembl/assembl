How to upgrade to version with elasticsearch indexing
=====================================================

You need to run again::

    fab -c assembl/configs/develop.rc app_compile

to rebuild supervisord.conf from supervisord.conf.tmpl and install
additional pip dependencies (elasticsearch-py).

install elasticsearch with::

    fab -c assembl/configs/develop.rc install_elasticsearch

(If later you want to upgrade elasticsearch, modify the ELASTICSEARCH_VERSION
in `fabfile.py` and run the ``fab -c assembl/configs/develop.rc upgrade_elasticsearch`` command.)

Reload supervisord config and start the elasticsearch process with::

    supervisorctl update

Check that elasticsearch is running with `supervisorctl status`. If it's not,
run `supervisorctl start elasticsearch` or check if you have an error in the
logs.

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

