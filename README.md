Assembl
================

Presentation
------------------

Assembl is an Open Source application that enables hundreds or even thousands of people to work together effectively on the definition of new ideas. The application supports the belief that with the proper conditions, people working together can think smarter than any one member of the group could alone. Traditional collective intelligence software tends to refine ideas from one person. Assembl is different. It focuses on co-building new ideas.

Assembl is made with the following technologies :

- HTML5, [MarionetteJS](http://marionettejs.com/)
- [The Pyramid Framework](http://www.pylonsproject.org/)
- [Nginx](http://nginx.org/)
- [Virtuoso](http://virtuoso.openlinksw.com/)

Assembl is developed by [Imagine For People](http://imaginationforpeople.org)

## Installation for developers

**Prerequisites**

- On Mac OS X 10.9.2: The system python is incompatible with the clang 5.1. You need to remove all occurences of `-mno-fused-madd` in `/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/_sysconfigdata.py`. Also renew (or delete) the corresponding `.pyc`, `.pyo` files.

- For production on linux using nginx/uwsgi you need the following ppa (for both saucy and raring):
apt-add-repository ppa:chris-lea/uwsgi 

- Ruby does not like libreadline6, which comes on newer Ubuntus. Make sure you have libreadline-gplv2-dev instead of libreadline6-dev.

### Setup a development environment:

You need fabric 1.5.1 and a ssh server installed:

#### On Mac

The system python has an old but serviceable pip version. It can be updated with 

``` sh
sudo pip install -U pip
```

If you have Homebrew installed, and you want to use the Homebrew python, pip installs with python:

``` sh
brew install python
```

Either way, you should use pip to install fabric:

``` sh
pip install -U fabric
```

##### iODBC on Mac

Then, you need to install libiodbc. You can get it from [MacPorts](https://www.macports.org/), or we maintain [a package](http://assembl.coeus.ca/static/wheelhouse/iodbc.pkg) that you can install directly. That package was built on Yosemite; on an older system you way want to build [from source](http://www.iodbc.org/dataspace/iodbc/wiki/iODBC/Downloads). We are using version 3.52.9, with this MacPorts patch applied:

```patch
--- iodbcinst/unicode.h.orig
+++ iodbcinst/unicode.h
@@ -77,6 +77,7 @@
 #ifndef _UNICODE_H
 #define _UNICODE_H

+#include <sys/types.h>

 #if defined (__APPLE__) && !defined (MACOSX102) && !defined (HAVE_CONFIG_H)
 #define HAVE_WCHAR_H
```

#### On Ubuntu

You can get all that you need to bootstrap with:
``` sh
apt-get install fabric git openssh-server
```

And then:

``` sh
wget https://raw.github.com/ImaginationForPeople/assembl/develop/fabfile.py
fab devenv:projectpath=~/assembl install_builddeps
fab devenv:projectpath=~/assembl bootstrap
cd ~/assembl
```

or

``` sh
git clone https://github.com/ImaginationForPeople/assembl.git
cd assembl
fab devenv install_builddeps
fab devenv bootstrap_from_checkout
```

**Running**

Note:  memcached and redis must be running already.

``` sh
cd ~/assembl
```

Only the first time you run it:

``` sh
source venv/bin/activate
supervisord
#(wait for virtuoso to start)
```
Creating a user the first time you run assembl (so you have a superuser):

``` sh
assembl-add-user --email your_email@email.com --name "Your Name" --username desiredusername --password yourpassword development.ini
```

(NOTE: Just running $venv/bin/supervisord will NOT work,
as celery will run command line tools, thus breaking out of the environment.
You need to run source venv/bin/activate from the same terminal before
running the above)

On subsequent runs, just make sure supervisord is running.

Then, start the development server and compass with this command:
``` sh
supervisorctl start dev:
```


**Multiple environments**

If you want to run multiple environments on your machine, you should have different values for various parameters in `development.ini`.
In that case, you would copy it to a `local.ini` file, and customize the values there; substitute `local.ini` for `development.ini` in the rest of the instructions in this file.

Once you create your local.ini, re-run the `fab devenv app_setup` step.

The variables that have to be different between instances are the following (for convenience they are marked with UNIQUE_PER_SERVER in the ini file):

``` ini
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
```

Most of these are ports, and it should be easy to find an unoccupied port; in the case of `changes.socket`, you simply need a different filename, and in the case of `celery_task.*.broker`, the final number has to be changed to another low integer.

**Updating an environment**

``` sh
cd ~/assembl
#Any git operations (ex:  git pull)
fab devenv app_compile
$venv/bin/supervisorctl start dev:*
```
You can monitor any of the processes, for example pserve, with these commands:

``` sh
$venv/bin/supervisorctl tail -f dev:pserve
$venv/bin/supervisorctl tail -f dev:pserve stderr
```

In production:

``` sh
#(Instead of dev:*. You may have to stop dev:*)
$venv/bin/supervisorctl start prod:*
```

Updating an environment after switching branch locally (will regenerate css,
 all compiled files, update dependencies, database schema, etc.):

``` sh
fab devenv app_compile
```

Updating an environment to it's specified branch, tag or revision:

``` sh
cd ~/assembl
fab devenv app_fullupdate
```

Schema migrations
-----------------

Upgrade to latest manally:

``` sh
alembic -c development.ini upgrade head
```

Create a new one:

``` sh
alembic -c development.ini revision -m "Your message"
Make sure to verify the generated code...
```
Autogeneration (--autogenerate) isn't supported since we don't have full reflextion support in virtuoso's sqlalchemy driver.

Running tests
-------------
Only the first time you run it:

``` sh
cp testing.ini.example testing.ini
assembl-db-manage testing.ini bootstrap
```

Thereafter:
``` sh
supervisord
#(wait for virtuoso to start)
py.test --cov assembl assembl
```

Typically when developping a specific test:
``` sh
py.test assembl -s -k name_of_test --pdb
```

Python shell with database connection
-------------------------------------

``` sh
pshell development.ini
```

Raw sql connection
------------------

``` sh
isql-vt localhost:5132 dba dba
```

A note on vagrant
-----------------

If you use vagrant, we have a few processes that expect to use socket files in %(here)s. Vagrant does not allow creating sockets in a shared folder; so if you insist on using vagrant, make sure to move sockets locations. There is one is supervisord.conf, and one in an unkonwn location.


## Internationalization

See (doc/localization.md)
