assembl README
==================

Getting Started
---------------

Install required development libraries

- python-dev
- On Mac OS X 10.9.2: The system python is incompatible with the clang 5.1. You need to remove all occurences of `-mno-fused-madd` in `/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/_sysconfigdata.py`. Also renew (or delete) the corresponding `.pyc`, `.pyo` files.
- build-essential
- unixodbc-dev
- redis

Setup a development environment:

From scratch (you need fabric 1.8.1 and a ssh server installed):
- wget https://raw.github.com/ImaginationForPeople/assembl/develop/fabfile.py

- fab devenv:projectpath=~/assembl bootstrap

- cd ~/assembl

- cp development.ini local.ini

From a checkout

- git clone git@github.com:ImaginationForPeople/assembl.git your_checkout
- cd your_checkout
- fab devenv bootstrap_from_checkout

Dependencies: 

fab devenv install_builddeps


Compiling CSS
-------------
The previous steps should install compass and bower. Otherwise,

- fab devenv install_compass
- fab devenv install_bower

Setup the database
------------------
Only the first time you run it...

- venv/bin/assembl-db-manage development.ini bootstrap

Running
-------
Note:  memcached, redis and postgres must be running already.

Install Virtuoso.

On Ubuntu:

- sudo apt-get install virtuoso-server virtuoso-vad-conductor

On OS X, if you have MacPorts, you would sudo port install virtuoso
From source: http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSDownload

Note that you should use virtuoso 6; there are some terrible regressions with subquery joins
in virtuoso 7. (May be solved in 7.1, but we're not quite compatible yet.)

You need to set the environment variable VIRTUOSO_ROOT to the root of your virtuoso install.
On linux, this is probably /usr
If you have installed it with MacPorts, it would be /opt/local.
If you have installed it with a configure-make-make install, it would be 
/usr/local/virtuoso-opensource

- cd ~/assembl

Only the first time you run it:

- source venv/bin/activate
- assembl-ini-files development.ini
- supervisord
(wait for virtuoso to start)
- assembl-db-manage development.ini bootstrap
- assembl-db-manage testing.ini bootstrap
- supervisorctl start celery_imap

(NOTE: Currently, just running $venv/bin/supervisord does NOT work, as celery will run command line
 tools, thus breaking out of the environment.  You need to run source 
 venv/bin/activate from the same terminal before running the above)

On subsequent runs, just make sure supervisord is running.

Then, start the development server and compass with this command:
supervisorctl start dev:*

By default (development.ini), your assembl will be at:
http://localhost:6543/
Your virtuoso conductor (to peek at your database) will be at:
http://localhost:8892/



Updating an environment:

- cd ~/assembl

- fab devenv app_fullupdate

- compass compile

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
- that change router must be running (supervisorctl start changes_router)
- py.test assembl

To run a specific test, the syntax is: 
py.test -k test_get_ideas

Installing a new production environment
---------------------------------------

IMPORTANT NOTE ABOUT UWSGI:

As recently as ubuntu saucy (12.10) ubuntu includes a version of uwsgi that 
links with an old version of libzmq (if ldd /usr/bin/uwsgi shows that you link with
libzmq.so.1, you will be unable to connect to the zmq socket.  If it links with
libzmq.so.3, or doesn't link with libzmq.so at all, you should be fine)

To fix it on ubuntu:

sudo apt-add-repository ppa:chris-lea/uwsgi
sudo apt-get install uwsgi

Setup your environment in the fabfile

fab your_env bootstrap

Setup your ini file.  Typically you'll want to copy production.ini to local.ini
and change at least:  

[app:main]
sqlalchemy.url
db_user
db_password
changes.websocket.port 
[alembic]
sqlalchemy.url
[virtuoso]
port
[virtuoso]
http_port
[server:main]
port

fab your_env app_db_install
fab your_env app_fullupdate


Raw sql connection
------------------

isql-vt localhost:5132 dba dba


A note on vagrant
-----------------

If you use vagrant, we have a few processes that expect to use socket files in %(here)s. Vagrant does not allow creating sockets in a shared folder; so if you insist on using vagrant, make sure to move sockets locations. There is one is supervisord.conf, and one in an unkonwn location. 


Translations
------------
We use gettext through Babel. Instead of the usual gettext commands, extract strings from files throught `python setup.py extract_messages`, update the catalogs with `python setup.py update_catalog`, edit the catalogs in `assembl/locale/[language]/LC_MESSAGES/assembl.po`, and compile the catalogs with `python setup.py compile_catalog`.
