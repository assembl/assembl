assembl README
==================

Getting Started
---------------

- cd <directory containing this file>

- git submodule update --init; git submodule update

- $venv/bin/python setup.py develop

- cp development.ini local.ini

- $venv/bin/assembl-db-manage local.ini bootstrap

- $venv/bin/pserve --reload local.ini

