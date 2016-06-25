Installation for developers
===========================

Prerequisites
-------------

-  On Mac OS X 10.9.2: The system python is incompatible with the clang
   5.1. You need to remove all occurences of ``-mno-fused-madd`` in
   ``/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/_sysconfigdata.py``.
   Also renew (or delete) the corresponding ``.pyc``, ``.pyo`` files.

-  For production on linux using nginx/uwsgi you need the following ppa
   - Necessary for both saucy 13.10, raring 13.04, trusty 14.04
   - Not needed for vivid 15.04 and later

.. code:: sh

   apt-add-repository ppa:chris-lea/uwsgi
   apt-get install nginx uwsgi uwsgi-plugin-python


Setup a development environment:
--------------------------------

You need fabric 1.5.1 and a ssh server installed:

On Mac
~~~~~~

The system python has an old but serviceable pip version. It can be
updated with

.. code:: sh

    sudo pip install -U pip

If the terminal tells you command pip not found, follow the installation instructions of pip on https://pip.pypa.io/en/stable/installing/

Go to http://brew.sh and follow the instructions to install Homebrew. (It is required by the command fab devenv install_builddeps which will be run in a following step)
If you want to use the Homebrew python,
pip installs with python:

.. code:: sh

    brew install python

Either way, you should use pip to install fabric (you would need to sudo for the system python):

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
    fab install_builddeps
    fab bootstrap:projectpath=~/assembl
    cd ~/assembl

or

.. code:: sh

    git clone https://github.com/ImaginationForPeople/assembl.git
    cd assembl
    fab env_dev install_builddeps
    fab env_dev bootstrap_from_checkout

Note: If on Mac, command fab devenv install_builddeps outputs "Low level socket error: connecting to host localhost on port 22: Unable to connect to port 22 on 127.0.0.1", you have to go to System preferences > Sharing > check "Enable remote login", and retry the command.

Note:  If you get error:

fabric.exceptions.NetworkError: Incompatible ssh server (no acceptable macs)

You'll need to reconfigure your ssh server


Running
-------

Note: memcached and redis must be running already.

.. code:: sh

    cd ~/assembl

Only the first time you run it:

.. code:: sh

    source venv/bin/activate
    supervisord

Creating a user the first time you run assembl (so you have a
superuser):

.. code:: sh

    assembl-add-user --email your_email@email.com --name "Your Name" --username desiredusername --password yourpassword development.ini

(NOTE: Just running $venv/bin/supervisord will NOT work, as celery will
run command line tools, thus breaking out of the environment. You need
to run source venv/bin/activate from the same terminal before running
the above)

Note 2: If you do not want to ``source activate`` every time, you can hook it in your shell using something like `Autoenv <https://github.com/kennethreitz/autoenv>`_. Another option is to use `VirtualenvWrapper <https://bitbucket.org/virtualenvwrapper/virtualenvwrapper>`_ and its `Helper <https://justin.abrah.ms/python/virtualenv_wrapper_helper.html>`_. At least one of us uses `VirtualFish <https://github.com/adambrenecki/virtualfish>`_ with auto-activation.


On subsequent runs, just make sure supervisord is running.

Then, start the development server and compass with this command:

.. code:: sh

    supervisorctl start dev:

Multiple environments
~~~~~~~~~~~~~~~~~~~~~

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

A note on vagrant
~~~~~~~~~~~~~~~~~

If you use vagrant, we have a few processes that expect to use socket
files in %(here)s. Vagrant does not allow creating sockets in a shared
folder; so if you insist on using vagrant, make sure to move sockets
locations. There is one is supervisord.conf, and one in an unkonwn
location.

Updating an environment
-----------------------

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
~~~~~~~~~~~~~~~~~

Upgrade to latest manally:

.. code:: sh

    alembic -c development.ini upgrade head

Create a new one:

.. code:: sh

    alembic -c development.ini revision -m "Your message"
    Make sure to verify the generated code...

Autogeneration (--autogenerate) isn't supported since we don't have full
reflexion support in virtuoso's sqlalchemy driver.

Ontology Submodule
~~~~~~~~~~~~~~~~~~

The ontology module is a git submodule. As a result, after pulling in changes,
update with the following:

.. code:: sh

    git submodule update --init

Setting up a production dedicated instance
------------------------------------------

Start as a user with sudo access

.. code:: sh

    sudo apt-get install fabric git openssh-server
    sudo apt-get install nginx uwsgi uwsgi-plugin-python
    sudo adduser assembl_user #assembl_user is the name of a user dedicated to this instance
    sudo usermod -G www-data assembl_user
    sudo -u postgres createuser --createdb your_assembl_databaseuser
    sudo -u assembl_user -i
    
    git clone https://github.com/ImaginationForPeople/assembl.git
    cd assembl
    #Secure and give nginx access
    chmod -R o-rwx .
    chmod -R g-rw .
    chgrp www-data . assembl var var/run
    chgrp -R www-data assembl/static
    chmod -R g+rxs var/run
    find assembl/static -type d -print|xargs chmod g+rxs
    find assembl/static -type f -print|xargs chmod g+r
    cp production.ini local.ini

Change the values for:

If you use sentry to monitor:

* ``pipeline``
* ``raven_url``
* ``dsn``

Put your chosen database username and password in

* ``db_database``
* ``db_user``
* ``db_pasasword``
* ``sqlalchemy.url``  # CAREFUL: sqlalchemy.url needs to be edited TWICE in the file
* ``assembl.admin_email``

Just type a random strings in these two:
``session.secret``, ``security.email_token_salt``

Make sure your ssl works, and set

.. code:: ini

    accept_secure_connection = true
    require_secure_connection = true

Otherwise, your are jeopardiszing passwords...

The following must all be unique to the instance.  If you only have one instance on the server, you can keep the defaults

* ``changes.socket``
* ``changes.websocket.port``
* ``celery_tasks.imap.broker``
* ``celery_tasks.notification_dispatch.broker``
* ``celery_tasks.notify.broker``
* ``celery_tasks.translate.broker``
* ``port``

Set it to the user you created above
``uid``

(exit to sudoer account)

.. code:: sh

    fab devenv bootstrap_from_checkout
    assembl-add-user --email your_email@email.com --name "Your Name" --username desiredusername --password yourpassword local.ini

Copy the content of ``doc/sample_nginx_config/assembl.yourdomain.com`` into nginx config file, and modify

.. code:: sh

    sudo nano /etc/nginx/sites-available/assembl.yourdomain.com
    ln -s /etc/nginx/sites-available/assembl.yourdomain.com .

Copy the content of ``doc/sample_systemd_script/assembl.service`` into ``/etc/systemd/system/assembl.service``, and modify

.. code:: sh

    systemctl enable assembl
    service assembl restart

ensuite comme d'habitude
(fichier nginx, domaine dans bluehost et dans ovh, courriels, raven, piwik...)
