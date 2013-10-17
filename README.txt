assembl README
==================

Getting Started
---------------

Install required development libraries

- python-dev
- build-essential
- unixodbc-dev

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

Install Virtuoso.

On Ubuntu:

- sudo apt-get install virtuoso-server virtuoso-vad-conductor

On OS X, if you have MacPorts, you would sudo port install virtuoso
From source: http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSDownload

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
- $venv/bin/supervisorctl start celery_imap

On subsequent runs, just make sure supervisord is running.

Then, start the development server and compass with this command:
supervisorctl start dev:

Updating an environment:

- cd ~/assembl

- fab devenv app_fullupdate


Compiling CSS
-------------

You have to install compass (the first time, already done if you've used bootstrap above):

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

Use brew and install the libmemcached 
 - brew install libmemcached 

 Running on Ubuntu
 -----------------
 
 apt-get install unixodbc-dev virtuoso-opensource libxslt1-dev
