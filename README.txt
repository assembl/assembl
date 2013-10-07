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
- echo "user_create('assembl', 'assembl');"|isql-vt 1111 dba dba
- echo "grant select on db..tables to assembl;grant select on db..sys_users to assembl;"|isql-vt 1111 dba dba
- echo "db..user_set_qualifier ('assembl', 'assembl');"|isql-vt 1111 dba dba
- $venv/bin/assembl-db-manage development.ini bootstrap

In two separate terminals:
- $venv/bin/celery worker -l info -A assembl.tasks.imap -b sqla+virtuoso://assembl:assembl@VOS
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

Use brew and install the libmemcached 
 - brew install libmemcached 

 Running on Ubuntu
 -----------------
 
 apt-get install unixodbc-dev virtuoso-opensource libxslt1-dev
