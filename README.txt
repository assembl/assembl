assembl README
==================

Getting Started
---------------

Install required development libraries

- python-dev
- build-essential
- unixodbc-dev
- redis

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

On linux:  fab devenv install_builddeps

Compiling CSS
-------------
The previous steps should install compass. Otherwise,

- fab devenv install_compass

Running:

Install Virtuoso.

On Ubuntu:

- sudo apt-get install virtuoso-server virtuoso-vad-conductor

On OS X, if you have MacPorts, you would sudo port install virtuoso
From source: http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSDownload

Note that you should use virtuoso 6; there are some terrible regressions with subquery joins
in virtuoso 7.

You need to set the environment variable VIRTUOSO_ROOT to the root of your virtuoso install.
On linux, this is probably /usr
If you have installed it with MacPorts, it would be /opt/local.
If you have installed it with a configure-make-make install, it would be 
/usr/local/virtuoso-opensource

- cd ~/assembl

Only the first time you run it:

- $venv/bin/assembl-ini-files development.ini
- $venv/bin/supervisord
(wait for virtuoso to start)
- $venv/bin/assembl-db-manage development.ini bootstrap
- $venv/bin/assembl-db-manage testing.ini bootstrap
- $venv/bin/supervisorctl start celery_imap

On subsequent runs, just make sure supervisord is running.

Then, start the development server and compass with this command:
supervisorctl start dev:

Updating an environment:

- cd ~/assembl

- fab devenv app_fullupdate

- compass compile

Thereafter:
Note:  memcached, redis and postgres must be running already.
- $venv/bin/supervisord
- $venv/bin/supervisorctl start dev:*

You can monitor any of the processes, for example pserve, with these commands:
- $venv/bin/supervisorctl tail -f dev:pserve 
- $venv/bin/supervisorctl tail -f dev:pserve stderr

In production:

- $venv/bin/supervisorctl start prod:*
(Instead of dev:*. You may have to stop dev:*)

Updating an environment after switching branch locally (will regenerate css,
 all compiled files, update dependencies, database schema, etc.):

- fab devenv app_compile

Updating an environment to it's specified branch, tag or revision:

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
- nosetests


A note on vagrant
-----------------

If you use vagrant, we have a few processes that expect to use socket files in %(here)s. Vagrant does not allow creating sockets in a shared folder; so if you insist on using vagrant, make sure to move sockets locations. There is one is supervisord.conf, and one in an unkonwn location. 
