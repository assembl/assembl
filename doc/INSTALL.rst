Installing Assembl
==================

Prerequisites
-------------

-  If you have `yarn <https://yarnpkg.com>`__ javascript package manager
   installed, it will be used instead of `npm`.

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


Setup a development environment
-------------------------------

Install fabric and a SSH server
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You need fabric 1.5.1 and a SSH server installed. Here is how to install them on Mac and on Ubuntu.

On Mac
++++++

First install Homebrew by following the instructions at http://brew.sh ; or simply paste the following in the terminal:

.. code:: sh

    ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go/install)"

Make sure `/usr/local/bin` is in your `$PATH`. Then, install the homebrew python and fabric:

.. code:: sh

    brew install python fabric

MacOS has a SSH server installed. To activate it, go to System Preferences in the Apple Menu, then to the Sharing tab. Ensure the "Remote login" checkbox is active.

On Ubuntu
+++++++++

You can get all that you need to bootstrap with:

.. code:: sh

    apt-get install fabric git openssh-server sudo

Check out the code repository, install build dependencies, and bootstrap
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can run either:

.. code:: sh

    wget https://raw.github.com/assembl/assembl/develop/assembl/fabfile.py
    fab install_single_server
    fab bootstrap:projectpath=~/assembl
    cd ~/assembl

or:

.. code:: sh

    git clone https://github.com/assembl/assembl.git
    cd assembl
    fab -f assembl/fabfile.py -c assembl/configs/develop.rc install_single_server
    VIRTUAL_ENV=$(pwd)/venv fab -f assembl/fabfile.py -c assembl/configs/develop.rc bootstrap_from_checkout


Note: If on Mac: replace ``assembl/configs/develop.rc`` with ``assembl/configs/mac.rc``.

Note: If on Mac, command fab -c assembl/configs/develop.rc install_single_server outputs "Low level socket error: connecting to host localhost on port 22: Unable to connect to port 22 on 127.0.0.1", you have to go to System preferences > Sharing > check "Enable remote login", and retry the command.

Note: If you get the following error: ``fabric.exceptions.NetworkError: Incompatible ssh server (no acceptable macs)`` Then you'll need to reconfigure your ssh server


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

    assembl-add-user --email your_email@email.com --name "Your Name" --username desiredusername --password yourpassword local.ini

Note: Just running ``$venv/bin/supervisord`` will NOT work, as celery will
run command line tools, thus breaking out of the environment. You need
to run ``source venv/bin/activate`` from the same terminal before running
the above

Note: If you do not want to ``source activate`` every time, you can hook it in your shell using something like `Autoenv <https://github.com/kennethreitz/autoenv>`_. Another option is to use `VirtualenvWrapper <https://bitbucket.org/virtualenvwrapper/virtualenvwrapper>`_ and its `Helper <https://justin.abrah.ms/python/virtualenv_wrapper_helper.html>`_. At least one of us uses `VirtualFish <https://github.com/adambrenecki/virtualfish>`_ with auto-activation.


On subsequent runs, just make sure supervisord is running.

Then, start the development server and compass with this command:

.. code:: sh

    supervisorctl start dev:

You can now type http://localhost:6543 in your browser and log in using the credentials you created.

Multiple environments
~~~~~~~~~~~~~~~~~~~~~

If you want to run multiple environments on your machine, you should
have different values for various parameters in ``.rc`` files in the ``assembl/configs``
directory. You would create a ``local.rc`` based on ``assembl/configs/develop.rc``,
as described in :doc:`configuration`.

Once you create your local.rc, re-run the ``fab -c assembl/configs/local.rc app_setup``
step.

The variables that have to be different between instances are the
following (for convenience they are marked with UNIQUE\_PER\_SERVER in
the ini file):

.. code:: ini

    public_port = 6543
    changes.socket = ipc:///tmp/assembl_changes/0
    changes.websocket.port = 8085
    redis_socket = 0
    webpack_port = 8080
    server:main__port = 6543

Most of these are ports, and it should be easy to find an unoccupied
port; in the case of ``changes.socket``, you simply need a different
filename, and in the case of ``celery_task.*.broker``, the final number
has to be changed to another low integer.

A note on vagrant
~~~~~~~~~~~~~~~~~

If you use vagrant, we have a few processes that expect to use socket
files in %(here)s. Vagrant does not allow creating sockets in a shared
folder; so if you insist on using vagrant, make sure to move sockets
locations. Some are defined in supervisord.conf.tmpl, and changes.socket
is defined in the .ini files.

Updating an environment
-----------------------

.. code:: sh

    cd ~/assembl
    #Any git operations (ex:  git pull)
    fab -c assembl/configs/develop.rc app_compile
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

    fab -c assembl/configs/develop.rc app_compile

Updating an environment to it's specified branch, tag or revision:

.. code:: sh

    cd ~/assembl
    fab -c assembl/configs/develop.rc app_fullupdate

Schema migrations
~~~~~~~~~~~~~~~~~

Upgrade to latest manally:

.. code:: sh

    alembic -c local.ini upgrade head

Create a new one:

.. code:: sh

    alembic -c local.ini revision -m "Your message"
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

In what follows, we will assume that the nginx web server runs in group ``www-data``,
and that the assembl server runs under a dedicated user, called ``assembl_user``,
which should not be a sudoer. We suggest defining a group (``assembl_group``) for all assembl users.
Note: For a simple single-server setup, it is also possible to use the ``www-data`` user directly, and to put assembl in ``/var/www``.

Start as a user with sudo access

.. code:: sh

    sudo apt-get install fabric git openssh-server
    sudo apt-get install nginx uwsgi uwsgi-plugin-python
    sudo addgroup assembl_group
    sudo adduser assembl_user
    sudo usermod -G www-data -G assembl_group assembl_user


By default, postgres will not use passwords from postgres users who connect through the Unix socket domain (versus a network connection).
So if you want to make your database to be safer and ask for password anyway, edit your /etc/postgresql/9.1/main/pg_hba.conf file and

.. code:: ini

    # replace
    local   all             all                                peer
    # by
    local   all             all                                md5


and then run

.. code:: sh

    sudo service postgresql restart

Then, as the assembl_user:

.. code:: sh

    sudo -u assembl_user -i

    git clone https://github.com/assembl/assembl.git
    cd assembl

Change the values for:

If you use sentry to monitor:

* ``sentry_key``
* ``sentry_id``

Those will be used to create the ``sentry_dsn`` setting.

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

Otherwise, you are jeopardizing passwords...

The following must all be unique to the instance.  If you only have one instance on the server, you can keep the defaults

* ``changes.socket``
* ``changes.websocket.port``
* ``celery_tasks.imap.broker``
* ``celery_tasks.notification_dispatch.broker``
* ``celery_tasks.notify.broker``
* ``celery_tasks.translate.broker``
* ``public_port``

The ``public_port`` field (located in ``app:assembl`` section) is the actual port used by the UWSGI server which is rerouted through the reverse proxy served by nginx. For production context, use 80.
There is also a ``port`` field in ``server:main`` section, which defaults to 6543. If not proxied by nginx or something, ``port`` needs to match ``public_port``.

Also, set the ``uid`` field of your ini file to the username of the unix user you created above. For example: ``uid = assembl_user``
If you have not added this user to the www-data group as advised previously (or to a group which is common with the ngnix user), then you also have to set the ``gid`` field to a common group name.

If you do not have an SSL certificate, then you have to set ``accept_secure_connection = false`` and ``require_secure_connection = false`` (because if you set ``accept_secure_connection = true``, then the login page on assembl will try to show using https, which will not work).



.. code:: sh

    exit  # this logs out from the assembl_user user, back to the initial sudoer account
    cd /home/assembl_user/assembl
    fab -c assembl/configs/develop.rc install_single_server
    fab -c assembl/configs/develop.rc check_and_create_database_user
    sudo -u assembl_user -i  # back to the assembl user
    cd /home/assembl_user/assembl
    fab -c assembl/configs/develop.rc bootstrap_from_checkout
    source venv/bin/activate

Open a pshell and then exit it

.. code:: sh
    assembl-pshell local.ini
    exit

Add a sysadmin user

.. code:: sh

    assembl-add-user --email your_email@email.com --name "Your Name" --username desiredusername --password yourpassword local.ini

Copy the content of ``doc/sample_nginx_config/assembl.yourdomain.com`` into a new nginx config file, at ``/etc/nginx/sites-available/{{assembl.yourdomain.com}}`` (and replace its filename by your own domain):

.. code:: sh

    cp doc/sample_nginx_config/assembl.yourdomain.com /etc/nginx/sites-available/{{assembl.yourdomain.com}}

Edit this file using your favorite editor to match your domain and architecture (including SSL settings if any).
Activate this site, using:

.. code:: sh

    cd /etc/nginx/sites-enabled/
    ln -s /etc/nginx/sites-available/{{assembl.yourdomain.com}} .

Test that your configuration file works, by running:

.. code:: sh

    /usr/sbin/nginx -t

Restart nginx:

.. code:: sh

    /etc/init.d/nginx restart

Copy the content of ``doc/sample_systemd_script/assembl.service`` into ``/etc/systemd/system/assembl.service``, and modify fields ASSEMBL_PATH, User and Description.

.. code:: sh

    systemctl enable assembl
    service assembl restart

There is more to setup:
You may set up an external or internal SMTP server (TODO), an external IMAP server (TODO), and Piwik

The :doc:`vmm` document explains how to set up an internal IMAP server.
