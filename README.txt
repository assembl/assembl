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

On the Mac:

Use brew and install these components:
 - brew install memcached zeromq redis postgresql


Compiling CSS
-------------
The previous steps should install compass. Otherwise,

- fab devenv install_compass

Running:

- cd ~/assembl

Only the first time you run it:
sudo -u postgres createuser --createdb --no-createrole --no-superuser assembl --pwprompt
createdb -U assembl assembl
- $venv/bin/assembl-db-manage development.ini bootstrap
- compass compile

Thereafter:
- $venv/bin/supervisord
- $venv/bin/supervisorctl start dev:

You can monitor any of the processes, for example pserve, with these commands:
- $venv/bin/supervisorctl tail -f dev:pserve 
- $venv/bin/supervisorctl tail -f dev:pserve stderr

In production:

- $venv/bin/supervisorctl start prod:
(Instead of dev:. You may have to stop dev:)

Updating an environment:

- cd ~/assembl

- fab devenv app_fullupdate




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

