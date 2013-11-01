#!/bin/env python
# -*- coding:utf-8 -*-
from __future__ import with_statement

import os.path
import time
import pipes

import fabric.operations
from fabric.operations import put, get
from fabric.api import *
from fabric.colors import cyan
from fabric.contrib.files import *


@task
def reloadapp():
    """
    Touch the wsgi
    """
    if env.uses_supervisor:
        print(cyan('Asking supervisor to restart %(projectname)s' % env))
        run("sudo /usr/bin/supervisorctl restart %(projectname)s" % env)
    if env.uses_wsgi:
        print(cyan('Reloading all wsgi applications in : %s' % env.projectpath))
        #this may accidentally reload staging environments and the like, but it's the only reliable way to 
        #hit any multisites defined. 
        if env.uses_apache:
            with cd(env.projectpath):
                run('touch apache/*')
    if env.uses_memcache:
        flushmemcache()


def venvcmd(cmd, shell=True, user=None, pty=False):
    if not user:
        user = env.user

    with cd(env.projectpath):
        return run('source %(venvpath)s/bin/activate && ' % env + cmd, shell=shell, pty=pty)

def venv_prefix():
    return 'source %(venvpath)s/bin/activate' % env

def get_db_dump_name():
    return 'current_database.pgdump'

def remote_db_path():
    return os.path.join(env.projectpath, get_db_dump_name())

def printenv():
    """
    Print shell env
    """
    venvcmd('env')



## Virtualenv
@task
def build_virtualenv():
    """
    Build the virtualenv
    """
    print(cyan('Creating a fresh virtualenv'))
    require('venvpath', provided_by=('commonenv'))
    run('virtualenv --no-site-packages --distribute %(venvpath)s' % env)
    run('rm /tmp/distribute* || echo "ok"') # clean after myself
    

@task
def update_requirements(force=False):
    """
    update external dependencies on remote host
    """
    print(cyan('Updating requirements using PIP'))
    run('%(venvpath)s/bin/pip install -U pip' % env)
    
    if force:
        cmd = "%(venvpath)s/bin/pip install -I -r %(projectpath)s/requirements.txt" % env
    else:
        cmd = "%(venvpath)s/bin/pip install -r %(projectpath)s/requirements.txt" % env
    run("yes w | %s" % cmd)

@task
def app_db_update():
    """
    Migrates database using south
    """
    print(cyan('Migrating database'))
    venvcmd('alembic -c %s upgrade head' % (env.ini_file))

@task
def app_db_install():
    """
    Install db the first time and fake migrations
    """
    print(cyan('Installing database'))
    venvcmd('assembl-db-manage %s bootstrap' % (env.ini_file))

@task
def make_messages():
    """
    Run *.po file generation for translation
    """
    cmd = "python setup.py extract_messages"
    venvcmd(cmd)
    cmd = "python setup.py update_catalog"
    venvcmd(cmd)

@task
def compile_messages():
    """
    Run compile *.mo file from *.po
    """
    cmd = "python setup.py compile_catalog"
    venvcmd(cmd)

@task
def compile_stylesheets():
    """
    Generate *.css files from *.scss
    """
    with cd(env.projectpath):
        run('bundle exec compass compile --force', shell=True)
            
def tests():
    """
    Run all tests on remote
    """
    print(cyan('Running TDD tests'))
    venvcmd('./manage.py test')

    print(cyan('Running BDD tests'))
    venvcmd('./manage.py harvest --verbosity=2')


    
@task
def bootstrap():
    """
    Create the virtualenv and install the app
    """
    execute(clone_repository)
    execute(bootstrap_from_checkout)

@task
def bootstrap_from_checkout():
    """
    Create the virtualenv and install the app
    """
    execute(build_virtualenv)
    execute(install_rbenv)
    execute(app_fullupdate)
    
def clone_repository():
    """
    Clone repository and remove the exsiting one if necessary
    """
    print(cyan('Cloning Git repository'))

    # Remove dir if necessary
    if exists("%(projectpath)s/.git" % env):
        abort("%(projectpath)s/.git already exists" % env)

    # Clone
    run("git clone --branch {0} {1} {2}".format(env.gitbranch,
                                                env.gitrepo,
                                                env.projectpath)
    )
    
            
def updatemaincode():
    """
    Update code and/or switch branch
    """
    print(cyan('Updating Git repository'))
    with cd(os.path.join(env.projectpath)):
        run('git fetch')
        run('git checkout %s' % env.gitbranch)
        run('git pull %s %s' % (env.gitrepo, env.gitbranch))

def app_setup():
     venvcmd('pip install -Iv pip==1.4')
     venvcmd('pip install -e ./')
     
@task
def app_fullupdate():
    """
    Full Update: maincode and dependencies
    """
    execute(updatemaincode)
    execute(update_requirements, force=False)
    execute(update_compass)
    execute(app_compile)
    
@task
def app_update():
    """
    Fast Update: don't update requirements
    """
    execute(updatemaincode)
    execute(app_compile)

@task
def app_compile():
    """
    Fast Update: don't update requirements
    """
    execute(compile_stylesheets)
    execute(app_setup)
    execute(compile_messages)
    execute(app_db_update)
    # tests()
    execute(reloadapp)
    execute(webservers_reload)

## Webserver
def configure_webservers():
    """
    Configure the webserver stack.
    """
    # apache
    print(cyan('Configuring Apache'))
    sudo('cp %sapache/%s /etc/apache2/sites-available/%s' % (env.projectpath, env.urlhost, env.urlhost))
    sudo('a2ensite %s' % env.urlhost)

    # nginx
    print(cyan('Configuring Nginx'))
    sudo('cp %snginx/%s /etc/nginx/sites-available/%s' % (env.projectpath, env.urlhost, env.urlhost))
    with cd('/etc/nginx/sites-enabled/'):
        sudo('ln -sf ../sites-available/%s .' % env.urlhost)

    # Fix log dir
    execute(check_or_install_logdir)

    
def install_webservers():
    """
    Install the webserver stack
    """
    print(cyan('Installing web servers'))
    sudo('apt-get install apache2-mpm-prefork libapache2-mod-wsgi -y')
    sudo('apt-get install nginx -y')

@task
def webservers_reload():
    """
    Reload the webserver stack.
    """
    if env.uses_apache:
        print(cyan("Reloading apache"))
        # Apache (sudo is part of command line here because we don't have full
        # sudo access
        run('sudo /etc/init.d/apache2 reload')

    if env.uses_ngnix:
        # Nginx (sudo is part of command line here because we don't have full
        # sudo access
        print(cyan("Reloading nginx"))
        run('sudo /etc/init.d/nginx reload')

def webservers_stop():
    """
    Stop all webservers
    """
    if env.uses_apache:
        # Apache
        sudo('/etc/init.d/apache2 stop')

    if env.uses_ngnix:
        # Nginx
        sudo('/etc/init.d/nginx stop')    

def webservers_start():
    """
    Start all webservers
    """
    if env.uses_apache:
        # Apache
        sudo('/etc/init.d/apache2 start')

    if env.uses_ngnix:
        # Nginx
        sudo('/etc/init.d/nginx start')

    
def check_or_install_logdir():
    """
    Make sure the log directory exists and has right mode and ownership
    """
    print(cyan('Installing a log dir'))
    with cd(env.venvpath + '/'):
        sudo('mkdir -p logs/ ; chown www-data logs; chmod o+rwx logs ; pwd')


## Database server
def install_database_server():
    """
    Install a postgresql DB
    """
    print(cyan('Installing Postgresql'))
    sudo('apt-get install -y postgresql')

def create_database_user():
    """
    Create a user and a DB for the project
    """
    # FIXME: pg_hba has to be changed by hand (see doc)
    # FIXME: Password has to be set by hand (see doc)
    sudo('createuser %s -D -R -S' % env.projectname, user='postgres')
    
## Server packages    
def install_basetools():
    """
    Install required base tools
    """
    print(cyan('Installing base tools'))
    sudo('apt-get install -y python-virtualenv python-pip')
    sudo('apt-get install -y git mercurial subversion')
    sudo('apt-get install -y gettext')

def install_builddeps():
    """
    Will install commonly needed build deps for pip django virtualenvs.
    """
    print(cyan('Installing compilers and required libraries'))
    sudo('apt-get install -y build-essential python-dev libjpeg62-dev libpng12-dev zlib1g-dev libfreetype6-dev liblcms-dev libpq-dev libxslt1-dev libxml2-dev')

@task
def configure_rbenv():
    with cd(env.projectpath), settings(warn_only=True):
        if(run('rbenv local 1.9.3-p125').failed):
            # Install Ruby 1.9.3-p125:
            run('rbenv install 1.9.3-p125')
            # Rehash:
            run('rbenv rehash')
        if(run('bundle --version').failed):
            #install bundler
            run('gem install bundler')
            run('rbenv rehash')
        
@task
def install_ruby_build():
    if(run('ruby-build --help').failed):
        # Install ruby-build:
        with cd('/tmp'):
            run('git clone git://github.com/sstephenson/ruby-build.git')
        with cd('/tmp/ruby-build'):
            sudo('./install.sh')

@task
def install_rbenv():
    """
    Install the appropriate ruby environment for compass.
    """
    with cd(env.projectpath), settings(warn_only=True):
        if(run('ls ~/.rbenv').failed):    
            # Install rbenv:
            run('git clone git://github.com/sstephenson/rbenv.git ~/.rbenv')
            # Add rbenv to the path:
            run('echo \'export PATH="$HOME/.rbenv/bin:$PATH"\' >> .bash_profile')
            run('echo \'eval "$(rbenv init -)"\' >> .bash_profile')
            run('source ~/.bash_profile')
    # The above will work fine on a shell (such as on the server accessed using
    # ssh for a developement machine running a GUI, you may need to run the 
    # following from a shell (with your local user):
    #    echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.profile;
    #    echo 'eval "$(rbenv init -)"' >> ~/.profile;
    #    source ~/.profile;
    
    execute(install_ruby_build)
    execute(configure_rbenv)

@task
def install_compass():
    """
    (Re)Install compass, deleting current version 
    """
    execute(configure_rbenv)
    with cd(env.projectpath):
        run('rm -rf vendor/bundle')
        execute(update_compass)
@task
def update_compass():
    """
    Make sure compass version is up to date
    """
    execute(configure_rbenv)
    with cd(env.projectpath):
        run('bundle install --path=vendor/bundle')

def database_create():
    """
    """
    sudo('su - postgres -c "createdb -E UNICODE -Ttemplate0 -O%s %s"' % (env.db_user, env.db_name))

@task
def database_dump():
    """
    Dumps the database on remote site
    """
    if not exists(env.dbdumps_dir):
        run('mkdir -m700 %s' % env.dbdumps_dir)

    filename = 'db_%s.sql' % time.strftime('%Y%m%d')
    compressed_filename = '%s.pgdump' % filename
    absolute_path = os.path.join(env.dbdumps_dir, compressed_filename)

    # Dump
    with prefix(venv_prefix()), cd(env.projectpath):
        run('pg_dump --host=%s -U%s --format=custom -b %s > %s' % (env.db_host, env.db_user,
                                                 env.db_name,
                                                 absolute_path)
            )

    # Make symlink to latest
    with cd(env.dbdumps_dir):
        run('ln -sf %s %s' % (absolute_path, remote_db_path()))

@task
def database_download():
    """
    Dumps and downloads the database from the target server
    """
    execute(database_dump)
    get(remote_db_path(), './')

@task
def database_upload():
    """
    Uploads a local database backup to the target environment's server
    """
    if(env.wsginame != 'dev.wsgi'):
        put(get_db_dump_name(), remote_db_path())

@task    
def database_restore():
    """
    Restores the database backed up on the remote server
    """
    assert(env.wsginame in ('staging.wsgi', 'dev.wsgi'))
    env.debug = True
    
    if(env.wsginame != 'dev.wsgi'):
        execute(webservers_stop)
    
    # Drop db
    with settings(warn_only=True):
        sudo('su - postgres -c "dropdb %s"' % (env.db_name))

    # Create db
    execute(database_create)
    
    # Restore data
    with prefix(venv_prefix()), cd(env.projectpath):
        run('pg_restore --host=%s --dbname=%s -U%s --schema=public %s' % (env.db_host,
                                                  env.db_name,
                                                  env.db_user,
                                                  remote_db_path())
        )

    if(env.wsginame != 'dev.wsgi'):
        execute(webservers_start)

## Server scenarios
def commonenv(projectpath, venvpath=None):
    """
    Base environment
    """
    env.projectname = "assembl"
    env.projectpath = projectpath
    if venvpath:
        env.venvpath = venvpath
    else: 
        env.venvpath = os.path.join(projectpath,"venv")
        
    env.db_user = 'assembl'
    env.db_name = 'assembl'
    #It is recommended you keep localhost even if you have access to 
    # unix domain sockets, it's more portable across different pg_hba configurations.
    env.db_host = 'localhost'
    env.dbdumps_dir = os.path.join(projectpath, '%s_dumps' % env.projectname)
    env.ini_file = 'production.ini'
    #env.gitrepo = "ssh://webapp@i4p-dev.imaginationforpeople.org/var/repositories/imaginationforpeople.git"
    env.gitrepo = "git://github.com/ImaginationForPeople/assembl.git"
    env.gitbranch = "master"

    env.uses_memcache = True
    env.uses_wsgi = False
    env.uses_apache = False
    env.uses_ngnix = False
    env.uses_supervisor = False
# Specific environments 


@task
def devenv(projectpath=None):
    """
    [ENVIRONMENT] Developpement (must be run from the project path: 
    the one where the fabfile is)
    """
    
    if not projectpath:
        projectpath = os.path.dirname(os.path.realpath(__file__))
    commonenv(projectpath)
    env.wsginame = "dev.wsgi"
    env.urlhost = "localhost"
    env.ini_file = 'development.ini'
    #env.user = "webapp"
    #env.home = "webapp"
    require('projectname', provided_by=('commonenv',))
    env.uses_wsgi = False
    env.uses_apache = False
    env.uses_ngnix = False
    env.hosts = ['localhost']

    env.gitbranch = "develop"

@task    
def caravan_stagenv():
    """
    [ENVIRONMENT] Staging
    """
    commonenv(os.path.normpath("/sites/assembl/"))
    env.urlhost = "assembl.caravan.coop"
    env.user = "www-data"
    env.home = "www-data"
    env.ini_file = 'local.ini'
    require('projectname', provided_by=('commonenv',))
    env.hosts = ['assembl.caravan.coop']
    
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_supervisor = True
    env.gitbranch = "develop"


@task    
def coeus_stagenv():
    """
    [ENVIRONMENT] Staging
    """
    commonenv(os.path.normpath("/var/www/assembl/"))
    env.wsginame = "staging.wsgi"
    env.urlhost = "assembl.coeus.ca"
    env.user = "www-data"
    env.home = "www-data"
    env.ini_file = 'local.ini'
    require('projectname', provided_by=('commonenv',))
    env.hosts = ['coeus.ca']
    
    env.uses_apache = True
    env.uses_ngnix = False
    env.gitbranch = "develop"
    
@task
def prodenv():
    """
    [ENVIRONMENT] Production
    """
    commonenv()
    env.venvname = "assembl.imaginationforpeople.org"
    env.wsginame = "prod.wsgi"
    env.urlhost = "www.imaginationforpeople.org"
    env.user = "web"
    env.home = "www"
    require('projectname', provided_by=('commonenv',))
    env.hosts = ['i4p-prod.imaginationforpeople.org']

    env.gitbranch = "master"

@task
def flushmemcache():
    """
    Resetting all data in memcached
    """
    if env.uses_memcache:
        print(cyan('Resetting all data in memcached :'))
        run('echo "flush_all" | /bin/netcat -q 2 127.0.0.1 11211')


#THE FOLLOWING COMMANDS HAVEN'T BEEN PORTED YET
def fixperms():
    # Fix perms
    with cd(env.projectpath):
        with cd("%(projectpath)s" % env):
            run('mkdir media/uploads media/cache static/CACHE media/mugshots -p')
            sudo('chown www-data -R media/uploads media/cache media/mugshots static/CACHE')


@task
def bootstrap_full():
    """
    Install system tools, create venv and install app
    """
    sudo('apt-get update')
    
    execute(install_basetools)
    execute(install_database_server)
    execute(install_webservers)
    execute(install_builddeps)
    
    execute(bootstrap)
    
    if(env.wsginame == 'dev.wsgi'):
        execute(install_devdeps);

    execute(configure_webservers)
    execute(webservers_reload)

