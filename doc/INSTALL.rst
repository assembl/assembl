Installation for developers
===========================

**Prerequisites**

-  On Mac OS X 10.9.2: The system python is incompatible with the clang
   5.1. You need to remove all occurences of ``-mno-fused-madd`` in
   ``/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/_sysconfigdata.py``.
   Also renew (or delete) the corresponding ``.pyc``, ``.pyo`` files.

-  For production on linux using nginx/uwsgi you need the following ppa
   - Necessary for both saucy 13.10, raring 13.04, trusty 14.04
   - Not needed for vivid 15.04 and later
   
   apt-add-repository ppa:chris-lea/uwsgi

-  Ruby does not like libreadline6, which comes on newer Ubuntus. Make
   sure you have libreadline-gplv2-dev instead of libreadline6-dev.

Setup a development environment:
--------------------------------

You need fabric 1.5.1 and a ssh server installed:

On Mac
~~~~~~

The system python has an old but serviceable pip version. It can be
updated with

.. code:: sh

    sudo pip install -U pip

If you have Homebrew installed, and you want to use the Homebrew python,
pip installs with python:

.. code:: sh

    brew install python

Either way, you should use pip to install fabric:

.. code:: sh

    pip install -U fabric


On Ubuntu
~~~~~~~~~

You can get all that you need to bootstrap with:

.. code:: sh

    apt-get install fabric git openssh-server

And then:

.. code:: sh

    wget https://raw.github.com/ImaginationForPeople/assembl/develop/fabfile.py
    fab devenv:projectpath=~/assembl install_builddeps
    fab devenv:projectpath=~/assembl bootstrap
    cd ~/assembl

or

.. code:: sh

    git clone https://github.com/ImaginationForPeople/assembl.git
    cd assembl
    fab devenv install_builddeps
    fab devenv bootstrap_from_checkout

Note:  If you get error:

fabric.exceptions.NetworkError: Incompatible ssh server (no acceptable macs)

You'll need to reconfigure your ssh server


**Running**

Note: memcached and redis must be running already.

.. code:: sh

    cd ~/assembl

Only the first time you run it:

.. code:: sh

    source venv/bin/activate
    supervisord
    #(wait for virtuoso to start)

Creating a user the first time you run assembl (so you have a
superuser):

.. code:: sh

    assembl-add-user --email your_email@email.com --name "Your Name" --username desiredusername --password yourpassword development.ini

(NOTE: Just running $venv/bin/supervisord will NOT work, as celery will
run command line tools, thus breaking out of the environment. You need
to run source venv/bin/activate from the same terminal before running
the above)

On subsequent runs, just make sure supervisord is running.

Then, start the development server and compass with this command:

.. code:: sh

    supervisorctl start dev:

**Multiple environments**

If you want to run multiple environments on your machine, you should
have different values for various parameters in ``development.ini``. In
that case, you would copy it to a ``local.ini`` file, and customize the
values there; substitute ``local.ini`` for ``development.ini`` in the
rest of the instructions in this file.

Once you create your local.ini, re-run the ``fab devenv app_setup``
step.

The variables that have to be different between instances are the
following (for convenience they are marked with UNIQUE\_PER\_SERVER in
the ini file):

.. code:: ini

    [app:main]
    public_port = 6543
    changes.socket = ipc:///tmp/assembl_changes/0
    changes.websocket.port = 8085
    celery_tasks.imap.broker.broker = redis://localhost:6379/0
    celery_tasks.notification_dispatch.broker = redis://localhost:6379/1
    [server:main]
    port = 6543
    [virtuoso]
    port = 5132
    http_port = 8892

Most of these are ports, and it should be easy to find an unoccupied
port; in the case of ``changes.socket``, you simply need a different
filename, and in the case of ``celery_task.*.broker``, the final number
has to be changed to another low integer.

**Updating an environment**

.. code:: sh

    cd ~/assembl
    #Any git operations (ex:  git pull)
    fab devenv app_compile
    $venv/bin/supervisorctl start dev:*

You can monitor any of the processes, for example pserve, with these
commands:

.. code:: sh

    $venv/bin/supervisorctl tail -f dev:pserve
    $venv/bin/supervisorctl tail -f dev:pserve stderr

In production:

.. code:: sh

    #(Instead of dev:*. You may have to stop dev:*)
    $venv/bin/supervisorctl start prod:*

Updating an environment after switching branch locally (will regenerate
css, all compiled files, update dependencies, database schema, etc.):

.. code:: sh

    fab devenv app_compile

Updating an environment to it's specified branch, tag or revision:

.. code:: sh

    cd ~/assembl
    fab devenv app_fullupdate

Schema migrations
=================

Upgrade to latest manally:

.. code:: sh

    alembic -c development.ini upgrade head

Create a new one:

.. code:: sh

    alembic -c development.ini revision -m "Your message"
    Make sure to verify the generated code...

Autogeneration (--autogenerate) isn't supported since we don't have full
reflextion support in virtuoso's sqlalchemy driver.

Running tests
=============

Only the first time you run it:

.. code:: sh

    cp testing.ini.example testing.ini
    assembl-db-manage testing.ini bootstrap

Thereafter:

.. code:: sh

    supervisord
    #(wait for virtuoso to start)
    py.test --cov assembl assembl

Typically when developping a specific test:

.. code:: sh

    py.test assembl -s -k name_of_test --pdb

Python shell with database connection
=====================================

.. code:: sh

    pshell development.ini

Raw sql connection
==================

.. code:: sh

    isql-vt localhost:5132 dba dba

A note on vagrant
=================

If you use vagrant, we have a few processes that expect to use socket
files in %(here)s. Vagrant does not allow creating sockets in a shared
folder; so if you insist on using vagrant, make sure to move sockets
locations. There is one is supervisord.conf, and one in an unkonwn
location.

Ontology Submodule
==================

The ontology module is a git submodule. As a result, after pulling in changes,
update with the following:

.. code:: sh

    git submodule update --init
