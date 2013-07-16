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
    if env.uses_wsgi:
        print(cyan('Reloading all wsgi applications in : %s' % env.venvpath + '/' + env.projectname))
        #this may accidentally reload staging environments and the like, but it's the only reliable way to 
        #hit any multisites defined. 
        with cd(env.venvpath + '/' + env.projectname):
            run('touch apache/*')
    if env.uses_memcache:
        flushmemcache()


def venvcmd(cmd, shell=True, user=None, pty=False, subdir=""):
    if not user:
        user = env.user

    with cd(env.venvpath + '/' + env.projectname + '/' + subdir):
        return run('source %(venvpath)s/bin/activate && ' % env + cmd, shell=shell, pty=pty)

def venv_prefix():
    return 'source %(venvpath)s/bin/activate' % env

def remote_db_path():
    return os.path.join(env.venvpath, env.projectname, 'current_database.sql.bz2')

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
    require('venvpath', provided_by=('stagenv', 'prodenv'))
    sudo('rm /tmp/distribute* || echo "ok"') # clean after hudson
    run('virtualenv --no-site-packages --distribute %(venvpath)s' % env)
    sudo('rm /tmp/distribute* || echo "ok"') # clean after myself
    

@task
def update_requirements(force=False):
    """
    update external dependencies on remote host
    """
    print(cyan('Updating requirements using PIP'))
    run('%(venvpath)s/bin/pip install -U pip' % env)
    
    if force:
        cmd = "%(venvpath)s/bin/pip install -I -r %(venvpath)s/%(projectname)s/requirements.txt" % env
    else:
        cmd = "%(venvpath)s/bin/pip install -r %(venvpath)s/%(projectname)s/requirements.txt" % env
    run("yes w | %s" % cmd)


## Django
def app_db_update():
    """
    Migrates database using south
    """
    print(cyan('Migrating Django database'))
    venvcmd('./manage.py syncdb --noinput')
    venvcmd('./manage.py migrate')

def app_db_install():
    """
    Install db the first time and fake migrations
    """
    print(cyan('Installing Django database'))
    venvcmd('./manage.py syncdb --all --noinput')
    venvcmd('./manage.py migrate --fake')

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
    with cd(env.venvpath + '/' + env.projectname):
        run('bundle exec compass compile --force', shell=True)
            
def tests():
    """
    Run all tests on remote
    """
    print(cyan('Running TDD tests'))
    venvcmd('./manage.py test')

    print(cyan('Running BDD tests'))
    venvcmd('./manage.py harvest --verbosity=2')

def fixperms():
    # Fix perms
    with cd(env.venvpath):
        with cd("%(projectname)s" % env):
            run('mkdir media/uploads media/cache static/CACHE media/mugshots -p')
            sudo('chown www-data -R media/uploads media/cache media/mugshots static/CACHE')
    
@task
def bootstrap_venv():
    """
    Create the virtualenv and install the app
    """
    execute(build_virtualenv)
    execute(app_install)
    execute(fixperms)

def clone_repository():
    """
    Clone repository and remove the exsiting one if necessary
    """
    print(cyan('Cloning Git repository'))

    with cd(env.venvpath):
        # Remove dir if necessary
        if exists("%(projectname)s" % env):
            sudo("rm -rf %(projectname)s" % env)

        # Clone
        run("git clone --branch {0} {1} {2}".format(env.gitbranch,
                                                    env.gitrepo,
                                                    env.projectname)
        )
    
            
def updatemaincode():
    """
    Update code and/or switch branch
    """
    print(cyan('Updating Git repository'))
    with cd(os.path.join(env.venvpath, '%(projectname)s' % env)):
        run('git fetch')
        run('git checkout %s' % env.gitbranch)
        run('git pull %s %s' % (env.gitrepo, env.gitbranch))

@task
def app_install():
    """
    (Re)install app to target server
    """
    execute(clone_repository)
    execute(update_requirements, force=False)
    execute(compile_messages)
    #execute(app_db_install)
    # tests()
    execute(reloadapp)
    
@task
def app_fullupdate():
    """
    Full Update: maincode and dependencies
    """
    execute(updatemaincode)
    execute(compile_messages)
    execute(update_compass)
    execute(compile_stylesheets)
    execute(update_requirements, force=False)
    #execute(app_db_update)
    # tests()
    execute(reloadapp)
    execute(webservers_reload)

@task
def app_update():
    """
    Fast Update: don't update requirements
    """
    execute(updatemaincode)
    execute(compile_messages)
    execute(compile_stylesheets)
    #execute(app_db_update)
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
    fullprojectpath = env.venvpath + '/%(projectname)s/' % env
    sudo('cp %sapache/%s /etc/apache2/sites-available/%s' % (fullprojectpath, env.urlhost, env.urlhost))
    sudo('a2ensite %s' % env.urlhost)

    # nginx
    print(cyan('Configuring Nginx'))
    sudo('cp %snginx/%s /etc/nginx/sites-available/%s' % (fullprojectpath, env.urlhost, env.urlhost))
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
    sudo('apt-get install -y postgresql-8.4 postgresql-8.4 postgresql-8.4-postgis postgis')

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
    with cd(env.venvpath + '/' + env.projectname + '/'), settings(warn_only=True):
        if(run('rbenv local 1.9.3-p125').failed):
            # Install Ruby 1.9.3-p125:
            run('rbenv install 1.9.3-p125')
            # Rehash:
            run('rbenv rehash')
        if(run('bundle --version').failed):
            #install bundler
            sudo('gem install bundler', user=env.user)
            sudo('rbenv rehash')
        
@task
def install_rbenv():
    """
    Install the appropriate ruby environment for compass.
    """
    # Install rbenv:
    sudo('git clone git://github.com/sstephenson/rbenv.git ~/.rbenv', user=env.user)
    # Add rbenv to the path:
    sudo('echo \'export PATH="$HOME/.rbenv/bin:$PATH"\' >> .bash_profile', user=env.user)
    sudo('echo \'eval "$(rbenv init -)"\' >> .bash_profile', user=env.user)
    sudo('source ~/.bash_profile', user=env.user)
    # The above will work fine on a shell (such as on the server accessed using
    # ssh for a developement machine running a GUI, you may need to run the 
    # following from a shell (with your local user):
    #    echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.profile;
    #    echo 'eval "$(rbenv init -)"' >> ~/.profile;
    #    source ~/.profile;
    
    # Install ruby-build:
    with cd('/tmp'):
        sudo('git clone git://github.com/sstephenson/ruby-build.git', user=env.user)
    with cd('/tmp/ruby-build'):
        sudo('./install.sh')

    execute(configure_rbenv)

@task
def install_compass():
    """
    (Re)Install compass, deleting current version 
    """
    execute(configure_rbenv)
    with cd(env.venvpath + '/' + env.projectname + '/'):
        run('rm -rf vendor/bundle')
        execute(update_compass)
@task
def update_compass():
    """
    Make sure compass version is up to date
    """
    with cd(env.venvpath + '/' + env.projectname + '/'):
        run('bundle install --path=vendor/bundle')

## Server scenarios
def commonenv():
    """
    Base environment
    """
    env.projectname = "assembl"

    env.db_user = 'assembl'
    env.db_name = 'assembl'
    env.dbdumps_dir = os.path.join(tempfile.gettempdir(), '%s_dumps' % env.projectname)
    
    #env.gitrepo = "ssh://webapp@i4p-dev.imaginationforpeople.org/var/repositories/imaginationforpeople.git"
    env.gitrepo = "git://github.com/ImaginationForPeople/assembl.git"
    env.gitbranch = "master"

    env.uses_memcache = False
    env.uses_wsgi = True
    env.uses_apache = True
    env.uses_ngnix = True
# Specific environments 


@task
def devenv(venvpath=None):
    """
    [ENVIRONMENT] Developpement (must be run from the project path: 
    the one where the fabfile is)
    """
    commonenv()
    env.wsginame = "dev.wsgi"
    env.urlhost = "localhost"
    #env.user = "webapp"
    #env.home = "webapp"
    require('projectname', provided_by=('commonenv',))
    env.uses_wsgi = False
    env.uses_apache = False
    env.uses_ngnix = False
    env.hosts = ['localhost']

    current_path = local('pwd',capture=True)
    
    env.gitbranch = "develop"
    if venvpath:
        env.venvpath = venvpath
    else: 
        env.venvpath = os.path.normpath(os.path.join(current_path,"../"))


@task    
def coeus_stagenv():
    """
    [ENVIRONMENT] Staging
    """
    commonenv()
    env.wsginame = "staging.wsgi"
    env.urlhost = "assembl.coeus.ca"
    env.user = "benoitg"
    env.home = "benoitg"
    require('projectname', provided_by=('commonenv',))
    env.hosts = ['coeus.ca']
    
    env.uses_apache = True
    env.uses_ngnix = False
    #env.gitbranch = "release/almostspring"
    env.gitbranch = "develop"
    #env.gitbranch = "feature/gis"


    env.venvpath = os.path.normpath("/var/www/assembl/virtualenv/")
    
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

    env.venvpath = os.path.normpath("/var/www/assembl/virtualenv/")
    



#THE FOLLOWING COMMANDS HAVEN'T BEEN PORTED YET

@task
def flushmemcache():
    """
    Resetting all data in memcached
    """
    if env.uses_memcache:
        print(cyan('Resetting all data in memcached :'))
        run('echo "flush_all" | /bin/netcat -q 2 127.0.0.1 11211')


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
    execute(install_rbenv)
    execute(install_compass)
    
    execute(bootstrap_venv)
    
    if(env.wsginame == 'dev.wsgi'):
        execute(install_devdeps);

    execute(configure_webservers)
    execute(webservers_reload)

