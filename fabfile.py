#!/bin/env python
# -*- coding:utf-8 -*-
from __future__ import with_statement

from os import getenv
from platform import system
from time import sleep, strftime
import pipes
from ConfigParser import ConfigParser, NoOptionError
from StringIO import StringIO
# Importing the "safe" os.path commands
from os.path import join, dirname, split, normpath
# Other calls to os.path rarely mostly don't work remotely. Use locally only.
import os.path
from distutils.version import LooseVersion

import fabric.operations
from fabric.operations import put, get
from fabric.api import *
from fabric.colors import cyan, red, green
from fabric.contrib.files import *


def realpath(path):
    return run("python -c 'import os,sys;print os.path.realpath(sys.argv[1])' "+path)


def is_file(path):
    return run("test -f "+path, quiet=True).succeeded


def getmtime(path):
    if env.mac:
        return int(run("/usr/bin/stat -f '%m' "+path))
    else:
        return int(run("/usr/bin/stat -c '%Y' "+path))


def listdir(path):
    return run("ls "+path).split()


@task
def database_start():
    """
    Makes sure the database server is running
    """
    execute(supervisor_process_start, 'virtuoso')


@task
def supervisor_restart():
    with hide('running', 'stdout'):
        supervisord_cmd_result = venvcmd("supervisorctl shutdown")
    #Another supervisor,upstart, etc may be watching it, give it a little while
    #Ideally we should wait, but I didn't have time to code it.
    sleep(30);
    #If supervisor is already started, this will do nothing
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
            supervisord_cmd_result = venvcmd("supervisord -c %s" % get_supervisord_conf())
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


def supervisor_process_stop(process_name):
    """
    Assuming the supervisord process is running, stop one of its processes
    """
    print(cyan('Asking supervisor to stop %s' % process_name))
    supervisor_pid_regex = re.compile('^\d+')
    status_regex = re.compile('^%s\s*(\S*)' % process_name)
    with hide('running', 'stdout'):
        supervisord_cmd_result = venvcmd("supervisorctl pid")
    match = supervisor_pid_regex.match(supervisord_cmd_result)
    if not match:
        print(cyan('Supervisord doesn\'t seem to be running, nothing to stop'))
        return
    for try_num in range(20):
        venvcmd("supervisorctl stop %s" % process_name)
        with hide('running', 'stdout'):
            status_cmd_result = venvcmd("supervisorctl status %s" % process_name)

        match = status_regex.match(status_cmd_result)
        if match:
            status = match.group(1)
            if(status == 'STOPPED'):
                print(green("%s is stopped" % process_name))
                break
            if(status == 'FATAL'):
                print(red("%s had a fatal error" % process_name))
                break
            elif(status == 'RUNNING'):
                venvcmd("supervisorctl stop %s" % process_name)
            elif(status == 'STOPPING'):
                print(status)
            else:
                print("unexpected status: %s" % status)
            sleep(1)
        else:
            print(red('Unable to parse status (bad regex?)'))
            print(status_cmd_result)
            exit()


def maintenance_mode_start():
    assert env.uses_uwsgi
    supervisor_process_stop('prod:uwsgi')
    supervisor_process_start('maintenance_uwsgi')
    supervisor_process_stop('celery_notify_beat')
    supervisor_process_stop('source_reader')


def maintenance_mode_stop():
    assert env.uses_uwsgi
    supervisor_process_start('celery_notify_beat')
    supervisor_process_start('source_reader')
    supervisor_process_stop('maintenance_uwsgi')
    supervisor_process_start('prod:uwsgi')


@task
def app_majorupdate():
    "This update is so major that assembl needs to be put in maintenance mode. Only for production."
    execute(database_dump)
    execute(updatemaincode)
    execute(app_update_dependencies)
    execute(app_compile_nodbupdate)
    maintenance_mode_start()
    execute(app_db_update)
    if env.uses_global_supervisor:
        print(cyan('Asking supervisor to restart %(projectname)s' % env))
        run("sudo /usr/bin/supervisorctl restart %(projectname)s" % env)
    else:
        #supervisor config file may have changed
        venvcmd("supervisorctl reread")
        venvcmd("supervisorctl update")
        venvcmd("supervisorctl restart celery_imap changes_router celery_notification_dispatch celery_notify")
        maintenance_mode_stop()
    execute(webservers_reload)


@task
def app_reload():
    """
    Restart all necessary processes after an update
    """
    if env.uses_global_supervisor:
        print(cyan('Asking supervisor to restart %(projectname)s' % env))
        run("sudo /usr/bin/supervisorctl restart %(projectname)s" % env)
    else:
        #supervisor config file may have changed
        venvcmd("supervisorctl reread")
        venvcmd("supervisorctl update")
        venvcmd("supervisorctl restart celery_imap changes_router celery_notification_dispatch celery_notify celery_notify_beat source_reader")
        if env.uses_uwsgi:
            venvcmd("supervisorctl restart prod:uwsgi")
    """ This will log everyone out, hopefully the code is now resilient enough
    that it isn't necessary
    if env.uses_memcache:
        flushmemcache()
    """


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
    return join(env.projectpath, get_db_dump_name())


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
    import sys
    if hasattr(sys, 'real_prefix'):
        print(cyan('The virtualenv seems to already exist, so we don\'t try to create it again'))
        print(cyan('(otherwise the virtualenv command would produce an error)'))
        return
    run('virtualenv --no-site-packages --distribute %(venvpath)s' % env)
    run('rm /tmp/distribute* || echo "ok"') # clean after myself


@task
def update_requirements(force=False):
    """
    update external dependencies on remote host
    """
    print(cyan('Updating requirements using PIP'))
    venvcmd('pip install -U "pip>=6" ')

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
    venvcmd("python assembl/scripts/po2json.py")


@task
def compile_stylesheets():
    """
    Generate *.css files from *.scss
    """
    execute(update_compass)
    with cd(env.projectpath):
        run('bundle exec compass compile --force', shell=True)
        with cd('assembl/static/widget/card/app'):
            run('bundle exec compass compile --force --sass-dir scss --css-dir css', shell=True)

        with cd('assembl/static/widget/session'):
            run('bundle exec compass compile --force --sass-dir scss --css-dir css', shell=True)

        with cd('assembl/static/widget/video/app'):
            run('bundle exec compass compile --force --sass-dir scss --css-dir css', shell=True)

@task
def compile_javascript():
    """
    Generates and minifies javascript
    """
    with cd(env.projectpath):
        with cd('assembl'):
            run('../node_modules/gulp/bin/gulp.js browserify:prod')
            run('../node_modules/gulp/bin/gulp.js libs')


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
    Creates the virtualenv and install the app from env URL
    """
    execute(clone_repository)
    execute(bootstrap_from_checkout)


@task
def bootstrap_from_checkout():
    """
    Creates the virtualenv and install the app from git checkout
    """
    execute(updatemaincode)
    execute(build_virtualenv)
    execute(app_update_dependencies)
    execute(app_compile_nodbupdate)
    execute(app_db_install)
    execute(app_reload)
    execute(webservers_reload)


def clone_repository():
    """
    Clone repository
    """
    print(cyan('Cloning Git repository'))

    # Remove dir if necessary
    if exists("%(projectpath)s/.git" % env):
        abort("%(projectpath)s/.git already exists" % env)

    # Clone
    run("git clone --branch {0} {1} {2}".format(env.gitbranch,
                                                env.gitrepo,
                                                env.projectpath))


def updatemaincode():
    """
    Update code and/or switch branch
    """
    print(cyan('Updating Git repository'))
    with cd(join(env.projectpath)):
        run('git fetch')
        run('git checkout %s' % env.gitbranch)
        run('git pull %s %s' % (env.gitrepo, env.gitbranch))
        run('git submodule update --init')


def app_setup():
     # do the requirements separately to update the non-static versions.
     # This broke app_update_noupdate
     # And was done in the non DRY way
     # execute(update_requirements)
     venvcmd('pip install -e ./')
     venvcmd('assembl-ini-files %s' % (env.ini_file))


@task
def app_fullupdate():
    """
    Full Update: Update to latest git, update dependencies and compile app.
    You need internet connectivity, and can't run this on a branch.
    """
    execute(database_dump)
    execute(updatemaincode)
    execute(app_compile)


@task
def app_update():
    """
    Fast Update: Update to latest git, compile app but don't update requirements
    Useful for deploying hotfixes.  You need internet connectivity, and can't
    run this on a branch.
    """
    execute(database_dump)
    execute(updatemaincode)
    execute(app_compile_noupdate)


@task
def app_update_dependencies():
    """
    Updates all python and javascript dependencies
    """
    execute(update_requirements, force=False)
    execute(update_compass)
    execute(update_bower)
    execute(bower_update)
    execute(npm_update)


@task
def app_compile():
    """
    Full Update: This is what you normally run after a git pull.
    Doesn't touch git state, but updates requirements, rebuilds all
    generated files annd restarts whatever needs restarting.
    You need internet connectivity.  If you are on a plane, use
    app_compile_noupdate instead.
    """
    execute(app_update_dependencies)
    execute(app_compile_noupdate)


@task
def app_compile_noupdate():
    """
    Fast Update: Doesn't touch git state, don't update requirements, and rebuild
    all generated files. You normally do not need to have internet connectivity.
    """
    execute(app_compile_nodbupdate)
    execute(app_db_update)
    # tests()
    execute(app_reload)
    execute(webservers_reload)


@task
def app_compile_nodbupdate():
    "Separated mostly for tests, which need to run alembic manually"
    execute(virtuoso_install_or_upgrade)
    execute(app_setup)
    execute(compile_stylesheets)
    execute(compile_messages)
    execute(compile_javascript)

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


def install_bower():
    with cd(env.projectpath):
        run('npm install bower po2json requirejs')


def update_bower():
    with cd(env.projectpath):
        run('npm update bower po2json requirejs')


def bower_cmd(cmd, relative_path='.'):
    with settings(warn_only=True), hide('warnings', 'running', 'stdout', 'stderr'):
        node_cmd = run('which nodejs')
    if node_cmd.failed:
        node_cmd = run('which node')
    with cd(env.projectpath):
        bower_cmd = normpath(join(
            env.projectpath, 'node_modules', 'bower', 'bin', 'bower'))
        po2json_cmd = normpath(join(
            env.projectpath, 'node_modules', 'po2json', 'bin', 'po2json'))
        if not exists(bower_cmd) or not exists(po2json_cmd):
            print "Bower not present, installing..."
            execute(install_bower)
        with cd(relative_path):
            run(' '.join((node_cmd, bower_cmd, cmd)))

def _bower_foreach_do(cmd):
    bower_cmd(cmd)
    bower_cmd(cmd, 'assembl/static/widget/card')
    bower_cmd(cmd, 'assembl/static/widget/session')
    bower_cmd(cmd, 'assembl/static/widget/video')
    bower_cmd(cmd, 'assembl/static/widget/vote')
    bower_cmd(cmd, 'assembl/static/widget/creativity')
    bower_cmd(cmd, 'assembl/static/widget/share')
    
@task
def bower_install():
    """ Normally not called manually """
    execute(_bower_foreach_do, 'install')

@task
def bower_update():
    """ Normally not called manually """
    execute(_bower_foreach_do, 'update')

@task
def npm_update():
    """ Normally not called manually """
    with cd(env.projectpath):
        run('npm update')

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
        run('brew install libevent')
        # may require a sudo
        if not run('brew link libevent', quiet=True):
            sudo('brew link libevent')
        run('brew install memcached zeromq redis libtool libmemcached gawk')
        if not exists('/usr/local/bin/node'):
            run('brew install nodejs npm')
        if not exists('/usr/local/bin/autoconf'):
            run('brew install autoconf')
        if not exists('/usr/local/bin/automake'):
            run('brew install automake')
        if not exists('/usr/local/bin/pandoc'):
            run('brew install pandoc')
        if not exists('/usr/local/bin/twopi'):
            run('brew install graphviz')
            # may require a sudo
            if not run('brew link graphviz', quiet=True):
                sudo('brew link graphviz')
        # glibtoolize, bison, flex, gperf are on osx by default.
        # brew does not know aclocal, autoheader... 
        # They exist on macports, but do we want to install that?
    else:
        sudo('apt-get install -y build-essential python-dev ruby-builder')
        sudo('apt-get install -y nodejs nodejs-legacy npm pandoc')
        sudo('apt-get install -y automake bison flex gperf  libxml2-dev libssl-dev libreadline-dev gawk')
        sudo('apt-get install -y graphviz libgraphviz-dev pkg-config')

        #Runtime requirements (even in develop)
        sudo('apt-get install -y redis-server memcached unixodbc-dev')
    execute(update_python_package_builddeps)


@task
def update_python_package_builddeps():
    print(cyan('Installing/Updating python package native binary dependencies'))
    #For specific python packages in requirements.txt
    if env.mac:
        #I presume the runtime packages in install_builddeps come with headers on mac?
        pass
    else:
        sudo('apt-get install -y libmemcached-dev libzmq3-dev libxslt1-dev libffi-dev phantomjs')


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
        version = LooseVersion(match.group(1))
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
def start_edit_fontello_fonts():
    assert env.hosts == ['localhost'], "Meant to be run locally"
    try:
        import requests
    except ImportError:
        raise RuntimeError(
            "Please 'pip install requests' in your main environment")
    font_dir = join(
        env.projectpath, 'assembl', 'static', 'css', 'fonts')
    config_file = join(font_dir, 'config.json')
    id_file = join(font_dir, 'fontello.id')
    r=requests.post("http://fontello.com",
                    files={'config': open(config_file)})
    if not r.ok:
        raise RuntimeError("Could not get the ID")
    fid = r.text
    with open(id_file, 'w') as f:
        f.write(fid)
    if (env.host_string == 'localhost'):
        import webbrowser
        webbrowser.open('http://fontello.com/'+fid)


@task
def compile_fontello_fonts():
    from zipfile import ZipFile
    from StringIO import StringIO
    assert env.hosts == ['localhost'], "Meant to be run locally"
    try:
        import requests
    except ImportError:
        raise RuntimeError(
            "Please 'pip install requests' in your main environment")
    font_dir = join(
        env.projectpath, 'assembl', 'static', 'css', 'fonts')
    config_file = join(font_dir, 'config.json')
    id_file = join(font_dir, 'fontello.id')
    assert os.path.exists(id_file)
    with open(id_file) as f:
        fid = f.read()
    r = requests.get("http://fontello.com/%s/get" % fid)
    if not r.ok:
        raise RuntimeError("Could not get the data")
    with ZipFile(StringIO(r.content)) as data:
        for name in data.namelist():
            dirname, fname = split(name)
            dirname, subdir = split(dirname)
            if fname and (subdir == 'font' or fname == 'config.json'):
                with data.open(name) as fdata:
                    with open(join(font_dir, fname), 'wb') as ffile:
                        ffile.write(fdata.read())


def database_create():
    """
    """
    execute(database_start)


def virtuoso_db_directory():
    return join(env.projectpath, 'var/db')


@task
def database_dump():
    """
    Dumps the database on remote site
    """
    if not exists(env.dbdumps_dir):
        run('mkdir -m700 %s' % env.dbdumps_dir)

    execute(supervisor_process_start, 'virtuoso')

    filename = 'db_%s.bp' % strftime('%Y%m%d')
    absolute_path = join(env.dbdumps_dir, filename)

    # Dump
    with prefix(venv_prefix()), cd(env.projectpath):
        backup_output = venvcmd('assembl-db-manage %s backup' % (env.ini_file)
            )
    if backup_output.failed:
        print(red('Failed virtuoso backup'))
        exit()
    backup_file_path = join(virtuoso_db_directory(), backup_output)
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
    destination = join('./',get_db_dump_name())
    if is_link(destination):
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
    if(env.is_production_env is True):
        abort(red("You are not allowed to restore a database to a production " +
                "environment.  If this is a server restore situation, you " +
                "have to temporarily declare env.is_production_env = False " +
                "in the environment"))
    env.debug = True

    #if(env.wsginame != 'dev.wsgi'):
    #    execute(webservers_stop)
    with prefix(venv_prefix()), cd(virtuoso_db_directory()):
        venvcmd("supervisorctl stop virtuoso")
    # Drop db
    with cd(virtuoso_db_directory()), settings(warn_only=True):
        run('rm -f *.db *.trx')

    # Make symlink to latest
    #this MUST match the code in db_manage or virtuoso will refuse to restore
    restore_dump_prefix = "assembl-virtuoso-backup"
    restore_dump_name = restore_dump_prefix+"1.bp"
    with cd(virtuoso_db_directory()):
        run('cat %s > %s' % (remote_db_path(), join(virtuoso_db_directory(), restore_dump_name)))
    # Restore data
    with prefix(venv_prefix()), cd(virtuoso_db_directory()):
        venvcmd("supervisorctl stop virtuoso")
        run("%s +configfile %s +restore-backup %s" % (
            get_virtuoso_exec(), join(virtuoso_db_directory(), 'virtuoso.ini'),
        restore_dump_prefix))

    #clean up
    with cd(virtuoso_db_directory()):
        run('rm  %s' % (join(virtuoso_db_directory(),restore_dump_name)))

    execute(supervisor_process_start, 'virtuoso')


def get_config():
    if env.get('config', None):
        return env.config
    ini_file = join(env.projectpath, env.ini_file)
    if not exists(ini_file):
        return
    config_s = StringIO()
    get(ini_file, config_s)
    config_s.seek(0)
    config = ConfigParser()
    config.readfp(config_s)
    env.config = config
    return config


def get_virtuoso_root():
    config = get_config()
    assert config
    vroot = config.get('virtuoso', 'virtuoso_root')
    if vroot == 'system':
        return '/usr/local/virtuoso-opensource' if env.mac else '/usr'
    if vroot[0] != '/':
        return normpath(join(env.projectpath, vroot))
    return vroot


def get_virtuoso_exec():
    virtuoso_exec = os.path.join(get_virtuoso_root(), 'bin', 'virtuoso-t')
    return virtuoso_exec

def get_supervisord_conf():
    return os.path.join(env.projectpath, "supervisord.conf")

def get_virtuoso_src():
    config = get_config()
    vsrc = config.get('virtuoso', 'virtuoso_src')
    if vsrc[0] != '/':
        return normpath(join(env.projectpath, vsrc))
    return vsrc


@task
def flushmemcache():
    """
    Resetting all data in memcached
    """
    if env.uses_memcache:
        print(cyan('Resetting all data in memcached :'))
        wait_str = "" if env.mac else "-q 2"
        run('echo "flush_all" | nc %s 127.0.0.1 11211' % wait_str)


def ensure_virtuoso_not_running():
    # We do not want to start supervisord if not already running
    pidfile = join(env.projectpath, 'var/run/supervisord.pid')
    if not exists(pidfile):
        return
    pid = run('cat '+ pidfile)
    # Really running or stale?
    ps = run('ps '+pid, quiet=True)
    if ps.failed:
        run('rm '+pidfile)
        return
    execute(supervisor_process_stop, 'virtuoso')


@task
def virtuoso_reconstruct_save_db():
    execute(ensure_virtuoso_not_running)
    with cd(virtuoso_db_directory()):
        backup = run('%s +backup-dump +foreground' % (
            get_virtuoso_exec(),), quiet=True)
        if backup.failed:
            print "ERROR: Normal backup failed."
            # these were created by previous attempt
            run('rm -f virtuoso-temp.db virtuoso.pxa virtuoso.trx virtuoso.lck')
            run('%s +crash-dump +foreground' % (get_virtuoso_exec(),))


@task
def virtuoso_reconstruct_restore_db(transition_6_to_7=False):
    execute(ensure_virtuoso_not_running)
    with cd(virtuoso_db_directory()):
        run('mv virtuoso.db virtuoso_backup.db')
    trflag = '+log6' if transition_6_to_7 else ''
    with cd(virtuoso_db_directory()):
        r = run('%s +restore-crash-dump +foreground %s' % (
                get_virtuoso_exec(), trflag), timeout=30)
    execute(supervisor_process_start, 'virtuoso')
    with cd(virtuoso_db_directory()):
        run('rm virtuoso_backup.db')


@task
def virtuoso_reconstruct_db():
    execute(virtuoso_reconstruct_save_db)
    execute(virtuoso_reconstruct_restore_db)


def virtuoso_install_or_upgrade():
    with settings(warn_only=True), hide('warnings', 'stdout', 'stderr'):
        ls_cmd = run("ls %s" % get_virtuoso_exec())
        ls_supervisord_conf_cmd = run("ls %s" % get_supervisord_conf())
    if ls_cmd.failed or ls_supervisord_conf_cmd:
        print(red("Virtuso not installed, installing."))
        execute(virtuoso_source_install)
    else:
        execute(virtuoso_source_upgrade)

@task
def virtuoso_source_upgrade():
    "Upgrades the virtuoso server.  Currently doesn't check if we are already using the latest version."
    #Virtuoso must be running before the process starts, so that we can 
    #gracefully stop it later to ensure there is no trx file active.  
    #trx files are not compatible between virtuoso versions
    supervisor_process_start('virtuoso')
    execute(virtuoso_source_install)
    

@task
def virtuoso_source_install():
    "Install the virtuoso server locally, normally not called directly (use virtuoso_source_upgrade instead)"
    virtuoso_root = get_virtuoso_root()
    virtuoso_src = get_virtuoso_src()
    branch = get_config().get('virtuoso', 'virtuoso_branch')

    if exists(virtuoso_src):
        with cd(virtuoso_src):
            already_built = exists('binsrc/virtuoso/virtuoso-t')
            current_checkout = run('git rev-parse HEAD')
            if already_built and current_checkout == branch:
                return
            run('git fetch')
            run('git checkout '+branch)
            new_checkout = run('git rev-parse HEAD')
            if already_built and new_checkout == current_checkout:
                return
    else:
        run('mkdir -p ' + dirname(virtuoso_src))
        virtuso_github = 'https://github.com/openlink/virtuoso-opensource.git'
        run('git clone %s %s' %(virtuso_github, virtuoso_src))
        with cd(virtuoso_src):
            run('git checkout '+branch)
    with cd(virtuoso_src):
        if not exists(join(virtuoso_src, 'configure')):
            run('./autogen.sh')
        else:
            #Otherwise, it simply doesn't always work...
            run('make distclean')
        #This does not work if we change the path or anything else in local.ini
        #if exists(join(virtuoso_src, 'config.status')):
        #    run('./config.status --recheck')
        #else:

        run('./configure --with-readline --enable-maintainer-mode --prefix '+virtuoso_root)

        run("""physicalCpuCount=$([[ $(uname) = 'Darwin' ]] && 
                       sysctl -n hw.physicalcpu_max ||
                       nproc)
               make -j $(($physicalCpuCount + 1))""")
        need_sudo = False
        if not exists(virtuoso_root):
            if not run('mkdir -p ' + virtuoso_root, quiet=True).succeeded:
                need_sudo = True
                sudo('mkdir -p ' + virtuoso_root)
        else:
            need_sudo = run('touch '+virtuoso_root, quiet=True).failed
        execute(ensure_virtuoso_not_running)
        if need_sudo:
            sudo('checkinstall')
        else:
            run('make install')
        #Makes sure there is no trx file with content
        supervisor_process_stop('virtuoso')
        #If we ran this, there is a strong chance we just reconfigured the ini file
        # Make sure the virtuoso.ini and supervisor.ini reflects the changes
        execute(app_setup)
        execute(supervisor_restart)


## Server scenarios
def commonenv(projectpath, venvpath=None):
    """
    Base environment
    """
    env.projectname = "assembl"
    env.projectpath = projectpath
    assert env.ini_file, "Define env.ini_file before calling common_env"
    #Production env will be protected from accidental database restores
    env.is_production_env = False
    if venvpath:
        env.venvpath = venvpath
    else:
        env.venvpath = join(projectpath,"venv")

    env.db_user = 'assembl'
    env.db_name = 'assembl'
    #It is recommended you keep localhost even if you have access to
    # unix domain sockets, it's more portable across different pg_hba configurations.
    env.db_host = 'localhost'
    env.dbdumps_dir = join(projectpath, '%s_dumps' % env.projectname)
    env.gitrepo = "https://github.com/ImaginationForPeople/assembl.git"
    env.gitbranch = "master"

    env.uses_memcache = True
    env.uses_uwsgi = False
    env.uses_apache = False
    env.uses_ngnix = False
    #Where do we find the virtuoso binaries
    env.uses_global_supervisor = False
    env.mac = False

    #Minimal dependencies versions

    #Note to maintainers:  If you upgrade ruby, make sure you check that the
    # ruby_build version below supports it...
    env.ruby_version = "2.0.0-p481"
    env.ruby_build_min_version = LooseVersion('20130628')


# Specific environments

@task
def devenv(projectpath=None):
    "Alias of env_dev for backward compatibility"
    execute(env_dev, projectpath)

@task
def env_dev(projectpath=None):
    """
    [ENVIRONMENT] Local developpement environment
    (must be run from the project path: the one where the fabfile is)
    """
    if not projectpath:
        # Legitimate os.path
        projectpath = dirname(os.path.realpath(__file__))
    env.host_string = 'localhost'
    if exists(join(projectpath, 'local.ini')):
        env.ini_file = 'local.ini'
    else:
        env.ini_file = 'development.ini'
    env.pop('host_string')
    commonenv(projectpath, getenv('VIRTUAL_ENV', None))
    env.wsginame = "dev.wsgi"
    env.urlhost = "localhost"
    #env.user = "webapp"
    #env.home = "webapp"
    require('projectname', provided_by=('commonenv',))
    env.mac = system().startswith('Darwin')
    env.uses_apache = False
    env.uses_ngnix = False
    env.hosts = ['localhost']
    env.gitbranch = "develop"


@task
def env_coeus_assembl():
    """
    [ENVIRONMENT] Production on http://assembl.coeus.ca/
    Production environment for Bluenove and Imagination for People projects
    """
    env.ini_file = 'local.ini'
    commonenv(normpath("/var/www/assembl/"))
    env.is_production_env = True
    env.wsginame = "staging.wsgi"
    env.urlhost = "assembl.coeus.ca"
    env.user = "www-data"
    env.home = "www-data"
    require('projectname', provided_by=('commonenv',))
    env.hosts = ['coeus.ca']

    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = "master"


@task
def env_coeus_assembl2():
    """
    [ENVIRONMENT] Staging on http://assembl2.coeus.ca/
    Main staging environment
    """
    env.ini_file = 'local.ini'
    commonenv(normpath("/var/www/assembl2/"))
    env.is_production_env = False
    env.wsginame = "staging.wsgi"
    env.urlhost = "assembl2.coeus.ca"
    env.user = "www-data"
    env.home = "www-data"
    require('projectname', provided_by=('commonenv',))
    env.hosts = ['coeus.ca']

    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = "develop"


@task
def env_inm_agora():
    """
    [ENVIRONMENT] Production on http://agora.inm.qc.ca/
    hosted on coeus
    INM (Institut du nouveau monde) dedicated environment
    """
    env.ini_file = 'local.ini'
    commonenv(normpath("/var/www/assembl_inm/"))
    env.is_production_env = True
    env.wsginame = "prod.wsgi"
    env.urlhost = "agora.inm.qc.ca"
    env.user = "www-data"
    env.home = "www-data"
    require('projectname', provided_by=('commonenv',))
    env.hosts = ['discussions.bluenove.com']

    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = "master"


@task
def env_bluenove_discussions():
    """
    [ENVIRONMENT] Production on http://agora.inm.qc.ca/
    Common environment for Bluenove clients
    """
    env.ini_file = 'local.ini'
    commonenv(normpath("/var/www/assembl_discussions_bluenove_com/"))
    env.is_production_env = True
    env.wsginame = "prod.wsgi"
    env.urlhost = "discussions.bluenove.com"
    env.user = "www-data"
    env.home = "www-data"
    require('projectname', provided_by=('commonenv',))
    env.hosts = ['discussions.bluenove.com']

    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = "master"
