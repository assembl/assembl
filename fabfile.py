#!/bin/env python
# -*- coding:utf-8 -*-
from __future__ import with_statement

from os import getenv
from platform import system
import os.path
import time
import pipes

import fabric.operations
from fabric.operations import put, get
from fabric.api import *
from fabric.colors import cyan, red, green
from fabric.contrib.files import *
from time import sleep

@task
def database_start():
    """
    Makes sure the database server is running
    """
    execute(supervisor_process_start, 'virtuoso')
        
def supervisor_process_start(process_name):
    """
    Starts a supervisord process, and waits till it started to return
    """
    print(cyan('Asking supervisor to start %s' % process_name))
    supervisor_pid_regex = re.compile('^\d+')
    status_regex = re.compile('^%s\s*(\S*)' % process_name)
    with hide('running', 'stdout'):
        supervisord_cmd_result = venvcmd("supervisorctl pid")
    match = supervisor_pid_regex.match(supervisord_cmd_result)
    if not match:
        if env.uses_global_supervisor:
            print(red('Supervisord doesn\'t seem to be running, aborting'))
            exit()
        else:
            print(red('Supervisord doesn\'t seem to be running, trying to start it'))
            supervisord_cmd_result = venvcmd("supervisord")
            if supervisord_cmd_result.failed:
                print(red('Failed starting supervisord'))
                exit()
    for try_num in range(20):
        with hide('running', 'stdout'):
            status_cmd_result = venvcmd("supervisorctl status %s" % process_name)
        
        match = status_regex.match(status_cmd_result)
        if match:
            status = match.group(1)
            if(status == 'RUNNING'):
                print(green("%s is running" % process_name))
                break
            elif(status == 'STOPPED'):
                venvcmd("supervisorctl start %s" % process_name)
            elif(status == 'STARTING'):
                print(status)
            else:
                print("unexpected status: %s" % status)
            sleep(1)
            
        else:
            print(red('Unable to parse status (bad regex?)'))
            print(status_cmd_result)
            exit()



@task
def reloadapp():
    """
    Touch the wsgi
    """
    if env.uses_global_supervisor:
        print(cyan('Asking supervisor to restart %(projectname)s' % env))
        run("sudo /usr/bin/supervisorctl restart %(projectname)s" % env)
    else:
        venvcmd("supervisorctl restart celery_imap changes_router")
        if env.uses_uwsgi:
            venvcmd("supervisorctl restart prod:uwsgi")
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
    return 'assembl-virtuoso-backup.bp'

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
    venvcmd('pip install -U "pip>=1.5.1"')
    
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
    execute(database_start)
    print(cyan('Migrating database'))
    venvcmd('alembic -c %s upgrade head' % (env.ini_file))

@task
def app_db_install():
    """
    Install db the first time and fake migrations
    """
    execute(database_create)
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
    execute(update_compass)
    with cd(env.projectpath):
        run('bundle exec compass compile --force', shell=True)
        with cd('assembl/widget/creativity/app'):
            run('bundle exec compass compile --force --sass-dir scss --css-dir css', shell=True)


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
    execute(updatemaincode)
    execute(setup_in_venv)

@task
def setup_in_venv():
    """
    Setup the virtualenv (dependencies, ruby, etc.) and compile and install 
    assembl
    """
    execute(configure_rbenv)
    execute(app_update_dependencies)
    execute(app_setup)

@task
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
     venvcmd('pip install -U "pip>=1.5.1"')
     venvcmd('pip install -e ./')
     venvcmd('export VIRTUOSO_ROOT=%s ; assembl-ini-files %s' % (
        env.use_virtuoso, env.ini_file))

@task
def app_fullupdate():
    """
    Full Update: maincode and dependencies
    """
    execute(updatemaincode)
    execute(app_update_dependencies)
    execute(app_compile)
    
@task
def app_update():
    """
    Fast Update: don't update requirements
    """
    execute(updatemaincode)
    execute(app_compile)

@task
def app_update_dependencies():
    execute(update_requirements, force=False)
    execute(update_compass)
    execute(update_bower)
    execute(bower_install)
    execute(bower_update)
    
@task
def app_compile():
    """
    Fast Update: don't update requirements
    """
    execute(app_setup)
    execute(compile_stylesheets)
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
    # TODO: Mac
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
    if not env.mac:
        sudo('apt-get install apache2-mpm-prefork libapache2-mod-wsgi -y')
        sudo('apt-get install nginx -y')

apache_files = ('/etc/init.d/apache2', '/opt/local/apache2/bin/apachectl',
                '/usr/sbin/apachectl')

@task
def webservers_reload():
    """
    Reload the webserver stack.
    """
    if env.uses_apache:
        print(cyan("Reloading apache"))
        # Apache (sudo is part of command line here because we don't have full
        # sudo access
        for f in apache_files:
            if exists(f):
                run('sudo %s reload' % (f,))
                break

    if env.uses_ngnix:
        # Nginx (sudo is part of command line here because we don't have full
        # sudo access
        print(cyan("Reloading nginx"))
        if exists('/etc/init.d/nginx'):
            run('sudo /etc/init.d/nginx reload')
        elif env.mac:
            sudo('killall -HUP nginx')

def webservers_stop():
    """
    Stop all webservers
    """
    if env.uses_apache:
        # Apache
        for f in apache_files:
            if exists(f):
                run('sudo %s stop' % (f,))
                break

    if env.uses_ngnix:
        # Nginx
        if exists('/etc/init.d/nginx'):
            sudo('/etc/init.d/nginx stop')    
        elif env.mac:
            sudo('killall nginx')

def webservers_start():
    """
    Start all webservers
    """
    if env.uses_apache:
        # Apache
        for f in apache_files:
            if exists(f):
                run('sudo %s start' % (f,))
                break

    if env.uses_ngnix:
        # Nginx
        if exists('/etc/init.d/nginx'):
            sudo('/etc/init.d/nginx start')    
        elif env.mac and exists('/usr/local/nginx/sbin/nginx'):
            sudo('/usr/local/nginx/sbin/nginx')

    
def check_or_install_logdir():
    """
    Make sure the log directory exists and has right mode and ownership
    """
    print(cyan('Installing a log dir'))
    with cd(env.venvpath + '/'):
        sudo('mkdir -p logs/ ; chown www-data logs; chmod o+rwx logs ; pwd')


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
    if env.mac:
        run('cd /tmp; curl -O https://raw.github.com/pypa/pip/master/contrib/get-pip.py')
        sudo('python /tmp/get-pip.py')
        sudo('pip install virtualenv')
    else:
        sudo('apt-get install -y python-virtualenv python-pip')
        sudo('apt-get install -y git')
        #sudo('apt-get install -y gettext')

@task
def install_bower():
    with cd(env.projectpath):
        run('npm install bower')

@task
def update_bower():
    with cd(env.projectpath):
        run('npm update bower')


def bower_cmd(cmd, relative_path='.'):
    with settings(warn_only=True):
        node_cmd = run('which nodejs')
    if node_cmd.failed:
        node_cmd = run('which node')
    with cd(env.projectpath):
        bower_cmd = os.path.abspath(os.path.join(
            env.projectpath, 'node_modules', 'bower', 'bin', 'bower'))
        if not exists(bower_cmd):
            print "Bower not present, installing..."
            execute(install_bower)
        with cd(relative_path):
            run(' '.join((node_cmd, bower_cmd, cmd)))


@task
def bower_install():
    bower_cmd('install')
    bower_cmd('install', 'assembl/widget/creativity')


@task
def bower_update():
    bower_cmd('update')
    bower_cmd('update', 'assembl/widget/creativity')


@task
def install_builddeps():
    """
    Will install commonly needed build deps for pip django virtualenvs.
    """
    execute(install_basetools)
    print(cyan('Installing compilers and required libraries'))
    if env.mac:
        if not exists('/usr/local/bin/brew'):
            sudo('ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go/install)"')
        run('brew install memcached zeromq redis')
        if not exists('/usr/local/bin/node'):
            run('brew install nodejs npm')
    else:
        sudo('apt-get install -y build-essential python-dev ruby-builder')
        sudo('apt-get install -y nodejs npm')
        #For specific python packages in requirements.txt
        sudo('apt-get install -y libmemcached-dev libzmq3-dev')
        # libjpeg62-dev libpng12-dev zlib1g-dev libfreetype6-dev liblcms-dev libpq-dev libxslt1-dev libxml2-dev
        #Runtime requirements (even in develop)
        sudo('apt-get install -y redis-server memcached unixodbc-dev virtuoso-opensource')
    execute(install_bower)

@task
def configure_rbenv():
    execute(install_rbenv)
    with cd(env.projectpath), settings(warn_only=True):
        rbenv_local = run('rbenv local %(ruby_version)s' % env)
    if(rbenv_local.failed):
        execute(install_ruby_build)
        # Install Ruby specified in env.ruby_version:
        run('rbenv install %(ruby_version)s' % env)
        # Rehash:
        run('rbenv rehash')
        run('rbenv local %(ruby_version)s' % env)
    with settings(warn_only=True):
        bundle_version = run('bundle --version')
    if(bundle_version.failed):
        #install bundler
        run('gem install bundler')
        run('rbenv rehash')

def install_ruby_build():
    version_regex = re.compile('^ruby-build\s*(\S*)')
    install = False

    with settings(warn_only=True):
        run_output = run('ruby-build --version')
    if not run_output.failed:
        match = version_regex.match(run_output)
        version = float(match.group(1))
        
        if version < env.ruby_build_min_version:
            print(red("ruby-build %s is too old (%s is required), reinstalling..." % (version, env.ruby_build_min_version)))
            install = True
        else:
            print(green("ruby-build version %s is recent enough (%s is required)" % (version, env.ruby_build_min_version)))
    else:
        print(red("ruby-build is not installed, installing..."))
        install = True
        
    if install:
        # Install ruby-build:
        run('rm -rf /tmp/ruby-build')
        with cd('/tmp'):
            run('git clone https://github.com/sstephenson/ruby-build.git')
        with cd('/tmp/ruby-build'):
            sudo('./install.sh')

@task
def install_rbenv():
    """
    Install the appropriate ruby environment for compass.
    """
    with settings(warn_only=True):
        rbenv_failed = run('rbenv version').failed
    if rbenv_failed:
        with settings(warn_only=True):
            rbenv_missing = run('ls ~/.rbenv').failed
        if rbenv_missing:
            # Install rbenv:
            run('git clone https://github.com/sstephenson/rbenv.git ~/.rbenv')
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
        
        run('echo \'export PATH="$HOME/.rbenv/bin:$PATH"\' >> .profile')
        run('echo \'eval "$(rbenv init -)"\' >> .profile')
        run('source ~/.profile')

@task
def install_compass():
    """
    (Re)Install compass, deleting current version 
    """
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


@task
def compile_fontello_fonts():
    from zipfile import ZipFile
    from StringIO import StringIO
    try:
        import requests
    except ImportError:
        raise RuntimeError(
            "Please 'pip install requests' in your main environment")
    font_dir = os.path.join(
        env.projectpath, 'assembl', 'static', 'font', 'icon')
    config_file = os.path.join(font_dir, 'config.json')
    id_file = os.path.join(font_dir, 'fontello.id')
    if (not os.path.exists(id_file) or
            os.path.getmtime(id_file)>os.path.getmtime(config_file)):
        r=requests.post("http://fontello.com",
                        files={'config': open(config_file)})
        if not r.ok:
            raise RuntimeError("Could not get the ID")
        fid = r.text
        with open(id_file, 'w') as f:
            f.write(fid)
    else:
        with open(id_file) as f:
            fid = f.read()
    r = requests.get("http://fontello.com/%s/get" % fid)
    if not r.ok:
        raise RuntimeError("Could not get the data")
    with ZipFile(StringIO(r.content)) as data:
        for name in data.namelist():
            dirname, fname = os.path.split(name)
            dirname, subdir = os.path.split(dirname)
            if fname and subdir == 'font':
                with data.open(name) as fdata:
                    with open(os.path.join(font_dir, fname), 'wb') as ffile:
                        ffile.write(fdata.read())

def database_create():
    """
    """
    execute(database_start)

def virtuoso_db_directory():
    return os.path.join(env.projectpath, 'var/db')

@task
def database_dump():
    """
    Dumps the database on remote site
    """
    if not exists(env.dbdumps_dir):
        run('mkdir -m700 %s' % env.dbdumps_dir)

    execute(supervisor_process_start, 'virtuoso')

    filename = 'db_%s.bp' % time.strftime('%Y%m%d')
    absolute_path = os.path.join(env.dbdumps_dir, filename)

    # Dump
    with prefix(venv_prefix()), cd(env.projectpath):
        backup_output = venvcmd('assembl-db-manage %s backup' % (env.ini_file)
            )
    if backup_output.failed:
        print(red('Failed virtuoso backup'))
        exit()
    backup_file_path = os.path.join(virtuoso_db_directory(), backup_output)
    #Move to dbdumps_dir
    with settings(warn_only=True):
        move_result = run('mv %s %s' % (backup_file_path, absolute_path))
    if move_result.failed:
        print(red('Virtuoso backup did not error, but unable to move the file from %s to %s.\nYou may need to clear the file %s manually or your next backup will fail.' % (backup_file_path, absolute_path, backup_file_path)))
        exit()

    
    # Make symlink to latest
    with cd(env.dbdumps_dir):
        run('ln -sf %s %s' % (absolute_path, remote_db_path()))


@task
def database_download():
    """
    Dumps and downloads the database from the target server
    """
    destination = os.path.join('./',get_db_dump_name())
    if os.path.islink(destination):
        print('Clearing symlink at %s to make way for downloaded file' % (destination))
        local('rm %s' % (destination))
    execute(database_dump)
    get(remote_db_path(), destination)

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
    with prefix(venv_prefix()), cd(virtuoso_db_directory()):
        venvcmd("supervisorctl stop virtuoso")
    # Drop db
    with cd(virtuoso_db_directory()), settings(warn_only=True):
        run('rm *.db *.trx')

    # Make symlink to latest
    #this MUST match the code in db_manage or virtuoso will refuse to restore
    restore_dump_prefix = "assembl-virtuoso-backup"
    restore_dump_name = restore_dump_prefix+"1.bp"
    with cd(virtuoso_db_directory()):
        run('cat %s > %s' % (remote_db_path(), os.path.join(virtuoso_db_directory(), restore_dump_name)))
    # Restore data
    with prefix(venv_prefix()), cd(virtuoso_db_directory()):
        venvcmd("supervisorctl stop virtuoso")
        run("%s/bin/virtuoso-t +configfile %s +restore-backup %s" % (
            env.use_virtuoso, os.path.join(virtuoso_db_directory(), 'virtuoso.ini'),
        restore_dump_prefix))
        
    #clean up
    with cd(virtuoso_db_directory()):
        run('rm  %s' % (os.path.join(virtuoso_db_directory(),restore_dump_name)))

    execute(supervisor_process_start, 'virtuoso')
    
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
    env.gitrepo = "https://github.com/ImaginationForPeople/assembl.git"
    env.gitbranch = "master"

    env.uses_memcache = True
    env.uses_uwsgi = False
    env.uses_apache = False
    env.uses_ngnix = False
    #Where do we find the virtuoso binaries
    env.uses_global_supervisor = False
    env.mac = system().startswith('Darwin')
    env.use_virtuoso = getenv('VIRTUOSO_ROOT', '/usr/local/virtuoso-opensource' if env.mac else '/usr')

    #Minimal dependencies versions
    
    #Note to maintainers:  If you upgrade ruby, make sure you check that the 
    # ruby_build version below supports it...
    env.ruby_version = "2.0.0-p247"
    env.ruby_build_min_version = 20130628

# Specific environments 


@task
def devenv(projectpath=None):
    """
    [ENVIRONMENT] Developpement (must be run from the project path: 
    the one where the fabfile is)
    """
    
    if not projectpath:
        projectpath = os.path.dirname(os.path.realpath(__file__))
    commonenv(projectpath, getenv('VIRTUAL_ENV', None))
    env.wsginame = "dev.wsgi"
    env.urlhost = "localhost"
    env.ini_file = 'development.ini'
    #env.user = "webapp"
    #env.home = "webapp"
    require('projectname', provided_by=('commonenv',))
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
    env.uses_global_supervisor = True
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
    
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.use_virtuoso = "/usr"
    env.gitbranch = "develop"
    
@task
def coeus_stagenv2():
    """
    [ENVIRONMENT] Staging
    """
    commonenv(os.path.normpath("/var/www/assembl2/"))
    env.wsginame = "staging.wsgi"
    env.urlhost = "assembl2.coeus.ca"
    env.user = "www-data"
    env.home = "www-data"
    env.db_name = 'assembl2'
    env.ini_file = 'local.ini'
    require('projectname', provided_by=('commonenv',))
    env.hosts = ['coeus.ca']
    
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = "develop"

@task    
def inm_prodenv():
    """
    [ENVIRONMENT] INM
    """
    commonenv(os.path.normpath("/var/www/assembl_inm/"))
    env.wsginame = "prod.wsgi"
    env.urlhost = "agora.inm.qc.ca"
    env.user = "www-data"
    env.home = "www-data"
    env.ini_file = 'local.ini'
    require('projectname', provided_by=('commonenv',))
    env.hosts = ['coeus.ca']
    
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.use_virtuoso = "/usr"
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
        wait_str = "" if env.mac else "-q 2"
        run('echo "flush_all" | nc %s 127.0.0.1 11211' % wait_str)


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
    execute(install_webservers)
    execute(install_builddeps)
    
    execute(bootstrap)
    
    if(env.wsginame == 'dev.wsgi'):
        execute(install_devdeps);

    execute(configure_webservers)
    execute(webservers_reload)

