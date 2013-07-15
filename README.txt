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

Getting Started (fabric)
------------------------

wget ...
fab devenv:venvpath=~/venvassembl bootstrap_venv

Compiling CSS
-------------



You have too install compass (the first time):

- fab devenv install_compass

To run compass:

- cd <directory containing this file>

- bundle exec compass watch