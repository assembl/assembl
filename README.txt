assembl README
==================

Getting Started
---------------

Setup a development environment:

From scratch:
- wget https://raw.github.com/ImaginationForPeople/assembl/develop/fabfile.py

- fab devenv:projectpath=~/assembl bootstrap

- cd ~/assembl

- cp development.ini local.ini

From a checkout

- cd your_checkout
- fab devenv bootstrap_from_checkout

Running:

- cd ~/assembl

Only the first time you run it:
- $venv/bin/assembl-db-manage local.ini bootstrap

- $venv/bin/pserve --reload local.ini

Updating an environment:

- cd ~/assembl

- fab devenv app_fullupdate


Compiling CSS
-------------



You have too install compass (the first time, already done if you've used bootstrap above):

- fab devenv install_compass

To run compass:

- cd <directory containing this file>

- bundle exec compass watch