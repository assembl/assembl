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

- git clone git@github.com:ImaginationForPeople/assembl.git your_checkout
- cd your_checkout
- fab devenv bootstrap_from_checkout

Running:

- cd ~/assembl

Only the first time you run it:
sudo -u postgres createuser --createdb --no-createrole --no-superuser assembl --pwprompt
createdb -U assembl assembl
- $venv/bin/assembl-db-manage development.ini bootstrap

- $venv/bin/pserve --reload development.ini

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


Schema migrations
-----------------

Upgrade to latest:
- alembic -c development.ini upgrade head

Create a new one:
- alembic -c development.ini revision --autogenerate -m "Your message"
- Make sure to verify the generated code...


Running tests
-------------

- Copy testing.ini.example to testing.ini
- Create a testing database: createdb -U assembl assembl_test
- nosetests


Running on Mac OS
----------------

Use brew and install the libmemcached and zeromq
 - brew install libmemcached 
 - brew install zeromq
