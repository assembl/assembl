#!/bin/env python
# -*- coding:utf-8 -*-
from __future__ import with_statement

from os import getenv
from getpass import getuser
from platform import system
from time import sleep, strftime
import pipes
from ConfigParser import ConfigParser, SafeConfigParser, NoOptionError
from StringIO import StringIO
# Importing the "safe" os.path commands
from os.path import join, dirname, split, normpath
# Other calls to os.path rarely mostly don't work remotely. Use locally only.
import os.path
from distutils.version import LooseVersion

import fabric.operations
from fabric.operations import put, get
from fabric.api import *
from fabric.colors import yellow, cyan, red, green
from fabric.contrib.files import *

def realpath(path):
    return run("python -c 'import os,sys;print os.path.realpath(sys.argv[1])' " + path)


def is_file(path):
    return run("test -f " + path, quiet=True).succeeded

def is_dir(path):
    return run("test -d " + path, quiet=True).succeeded

def getmtime(path):
    if env.mac:
        return int(run("/usr/bin/stat -f '%m' " + path))
    else:
        return int(run("/usr/bin/stat -c '%Y' " + path))


def listdir(path):
    return run("ls " + path).split()


@task
def database_start():
    """
    Makes sure the database server is running
    """
    sanitize_env()
    if using_virtuoso():
        execute(supervisor_process_start, 'virtuoso')


@task
def supervisor_restart():
    "Restart supervisor itself."
    sanitize_env()
    with hide('running', 'stdout'):
        supervisord_cmd_result = venvcmd("supervisorctl shutdown")
    # Another supervisor,upstart, etc may be watching it, give it a little while
    # Ideally we should wait, but I didn't have time to code it.
    sleep(30);
    # If supervisor is already started, this will do nothing
    if using_virtuoso():
        execute(supervisor_process_start, 'virtuoso')

def is_supervisor_running():
    with settings(warn_only=True), hide('running', 'stdout', 'stderr'):
        supervisord_cmd_result = venvcmd("supervisorctl avail")
        if supervisord_cmd_result.failed:
            return False
        else:
            return True

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
    with settings(warn_only=True), hide('running', 'stdout'):
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


def as_bool(b):
    return str(b).lower() in {"1", "true", "yes", "t", "on"}


def filter_autostart_processes(processes):
    config = get_config()

    def is_autostart(p):
        try:
            return as_bool(config.get('supervisor', 'autostart_' + p))
        except NoOptionError:
            return False
    return [p for p in processes if is_autostart(p)]


@task
def app_majorupdate():
    "This update is so major that assembl needs to be put in maintenance mode. Only for production."
    sanitize_env()
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
        if is_supervisor_running():
            # supervisor config file may have changed
            venvcmd("supervisorctl reread")
            venvcmd("supervisorctl update")
            processes = filter_autostart_processes([
                "celery_imap", "changes_router", "celery_notification_dispatch",
                "celery_notify"])
            venvcmd("supervisorctl restart " + " ".join(processes))
            maintenance_mode_stop()
    execute(webservers_reload)


@task
def app_reload():
    """
    Restart all necessary processes after an update
    """
    sanitize_env()
    if env.uses_global_supervisor:
        print(cyan('Asking supervisor to restart %(projectname)s' % env))
        run("sudo /usr/bin/supervisorctl restart %(projectname)s" % env)
    else:
        if is_supervisor_running():
            venvcmd("supervisorctl stop dev:")
            # supervisor config file may have changed
            venvcmd("supervisorctl reread")
            venvcmd("supervisorctl update")
            processes = filter_autostart_processes([
                "celery_imap", "changes_router", "celery_notification_dispatch",
                "celery_notify", "celery_notify_beat", "source_reader"])
            venvcmd("supervisorctl restart " + " ".join(processes))
            if env.uses_uwsgi:
                venvcmd("supervisorctl restart prod:uwsgi")
    """ This will log everyone out, hopefully the code is now resilient enough
    that it isn't necessary
    if env.uses_memcache:
        flushmemcache()
    """


def as_venvcmd(cmd, chdir=False):
    cmd = '. %s/bin/activate && %s' % (env.venvpath, cmd)
    if chdir:
        cmd = 'cd %s && %s' % (env.projectpath, cmd)
    return cmd


def venvcmd(cmd, shell=True, user=None, pty=False, chdir=True):
    if not user:
        user = env.user
    return run(as_venvcmd(cmd, chdir), shell=shell, pty=pty)


def venv_prefix():
    return '. %(venvpath)s/bin/activate' % env


def get_db_dump_name():
    return 'assembl-virtuoso-backup.bp'


def remote_db_path():
    return join(env.projectpath, get_db_dump_name())


def printenv():
    """
    Print shell env
    """
    venvcmd('env')


# # Virtualenv
@task
def build_virtualenv():
    """
    Build the virtualenv
    """
    sanitize_env()
    print(cyan('Creating a fresh virtualenv'))
    require('venvpath', provided_by=('commonenv'))
    import sys
    # This is incorrect, it will check locally instead fo on the remote server
    if hasattr(sys, 'real_prefix'):
        print(cyan('The virtualenv seems to already exist, so we don\'t try to create it again'))
        print(cyan('(otherwise the virtualenv command would produce an error)'))
        return
    run('virtualenv %(venvpath)s' % env)
    if env.mac:
        # Virtualenv does not reuse distutils.cfg from the homebrew python,
        # and that sometimes precludes building python modules.
        bcfile = "/usr/local/Frameworks/Python.framework/Versions/2.7/lib/python2.7/distutils/distutils.cfg"
        vefile = env.venvpath + "/lib/python2.7/distutils/distutils.cfg"
        sec = "build_ext"
        if exists(bcfile):
            brew_config = SafeConfigParser()
            brew_config.read(bcfile)
            venv_config = SafeConfigParser()
            if exists(vefile):
                venv_config.read(vefile)
            if (brew_config.has_section(sec) and
                    not venv_config.has_section(sec)):
                venv_config.add_section(sec)
                for option in brew_config.options(sec):
                    val = brew_config.get(sec, option)
                    venv_config.set(sec, option, val)
                with open(vefile, 'w') as f:
                    venv_config.write(f)
    run('rm /tmp/distribute* || echo "ok"')  # clean after myself


@task
def update_pip_requirements(force_reinstall=False):
    """
    update external dependencies on remote host
    """
    sanitize_env()
    print(cyan('Updating requirements using PIP'))
    venvcmd('pip install -U "pip>=6" ')

    if force_reinstall:
        cmd = "%(venvpath)s/bin/pip install --ignore-installed -r %(projectpath)s/requirements.txt" % env
    else:
        cmd = "%(venvpath)s/bin/pip install -r %(projectpath)s/requirements.txt" % env
        run("yes w | %s" % cmd)


@task
def app_db_update():
    """
    Migrates database using south
    """
    sanitize_env()
    execute(database_start)
    print(cyan('Migrating database'))
    venvcmd('alembic -c %s upgrade head' % (env.ini_file))


@task
def reset_semantic_mappings():
    """
    Reset semantic mappings after a database restore
    """
    sanitize_env()
    execute(database_start)
    print(cyan('Resetting semantic mappings'))
    venvcmd("echo 'import assembl.semantic ; assembl.semantic.reset_semantic_mapping()'|pshell %s" % env.ini_file)


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
    sanitize_env()
    cmd = "python setup.py extract_messages"
    venvcmd(cmd)
    cmd = "python setup.py update_catalog"
    venvcmd(cmd)


@task
def compile_messages():
    """
    Run compile *.mo file from *.po
    """
    sanitize_env()
    cmd = "python setup.py compile_catalog"
    venvcmd(cmd)
    venvcmd("python assembl/scripts/po2json.py")


@task
def compile_stylesheets():
    """
    Generate *.css files from *.scss
    """
    sanitize_env()
    with cd(env.projectpath):
        with cd('assembl/static/js'):
            venvcmd('./node_modules/.bin/gulp sass', chdir=False)
        venvcmd('./assembl/static/js/node_modules/.bin/node-sass --source-map -r -o assembl/static/widget/card/app/css --source-map assembl/static/widget/card/app/css assembl/static/widget/card/app/scss', shell=True)
        venvcmd('./assembl/static/js/node_modules/.bin/node-sass --source-map -r -o assembl/static/widget/video/app/css --source-map assembl/static/widget/video/app/css assembl/static/widget/video/app/scss', shell=True)
        venvcmd('./assembl/static/js/node_modules/.bin/node-sass --source-map -r -o assembl/static/widget/session/css --source-map assembl/static/widget/session/css assembl/static/widget/session/scss', shell=True)


@task
def compile_javascript():
    """
    Generates and minifies javascript
    """
    sanitize_env()
    with cd(env.projectpath):
        with cd('assembl/static/js'):
            venvcmd('./node_modules/.bin/gulp libs', chdir=False)
            venvcmd('./node_modules/.bin/gulp browserify:prod', chdir=False)
            venvcmd('./node_modules/.bin/gulp build:test', chdir=False)


@task
def compile_javascript_tests():
    """Generates unified javascript test file"""
    sanitize_env()
    with cd(env.projectpath):
        with cd('assembl/static/js'):
            venvcmd('./node_modules/.bin/gulp build:test', chdir=False)


def tests():
    """
    Run all tests on remote
    """
    print(cyan('Running TDD tests'))
    venvcmd('./manage.py test')

    print(cyan('Running BDD tests'))
    venvcmd('./manage.py harvest --verbosity=2')


@task
def bootstrap(projectpath):
    """
    Creates the virtualenv and install the app from env URL

    takes the same arguments at env_dev, but projectpath is mandatory
    """
    sanitize_env()
    #env.projectname = "assembl"
    assert projectpath, "projectpath is mandatory, and corresponds to the directory where assembl will be installed"

    execute(skeleton_env, projectpath)
    execute(clone_repository)
    execute(env_dev, projectpath)
    execute(bootstrap_from_checkout)


@task
def bootstrap_from_checkout():
    """
    Creates the virtualenv and install the app from git checkout
    """
    sanitize_env()
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
    venvcmd('pip install -e ./')
    execute(setup_var_directory)
    venvcmd('assembl-ini-files %s' % (env.ini_file))


@task
def app_fullupdate():
    """
    Full Update: Update to latest git, update dependencies and compile app.
    You need internet connectivity, and can't run this on a branch.
    """
    sanitize_env()
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
    sanitize_env()
    execute(database_dump)
    execute(updatemaincode)
    execute(app_compile_noupdate)


@task
def app_update_dependencies(force_reinstall=False):
    """
    Updates all python and javascript dependencies.  Everything that requires a
    network connection to update
    """
    sanitize_env()
    execute(update_vendor_themes)
    execute(update_pip_requirements, force_reinstall=force_reinstall)
    #Nodeenv is installed by python , so this must be after update_pip_requirements
    execute(update_node, force_reinstall=force_reinstall)
    #bower is installed by node, so this must be after update_node
    execute(update_bower)
    execute(update_bower_requirements, force_reinstall=force_reinstall)
    execute(update_npm_requirements, force_reinstall=force_reinstall)

@task
def app_reinstall_all_dependencies():
    """
    Reinstall all python and javascript dependencies.
    Usefull after a OS upgrade, node upgrade, etc.
    """
    sanitize_env()
    execute(app_update_dependencies, force_reinstall=True)

@task
def update_node(force_reinstall=False):
    """
    Install node and npm to a known-good version
    """
    sanitize_env()
    node_version_cmd_regex = re.compile('^v6\.1\.0')
    with settings(warn_only=True), hide('running', 'stdout'):
        node_version_cmd_result = venvcmd("node --version")
    match = node_version_cmd_regex.match(node_version_cmd_result)
    if not match or force_reinstall:
        print(cyan('Upgrading node'))
        #Because otherwise node may be busy
        supervisor_process_stop('dev:gulp')
        venvcmd("nodeenv --node=6.1.0 --npm=3.8.6 --python-virtualenv assembl/static/js")
        with cd(get_node_base_path()):
            venvcmd("npm install reinstall -g", chdir=False)
    else:
        print(green('Node version ok'))

@task
def app_compile():
    """
    Full Update: This is what you normally run after a git pull.
    Doesn't touch git state, but updates requirements, rebuilds all
    generated files annd restarts whatever needs restarting.
    You need internet connectivity.  If you are on a plane, use
    app_compile_noupdate instead.
    """
    sanitize_env()
    execute(app_update_dependencies)
    execute(app_compile_noupdate)


@task
def app_compile_noupdate():
    """
    Fast Update: Doesn't touch git state, don't update requirements, and rebuild
    all generated files. You normally do not need to have internet connectivity.
    """
    sanitize_env()
    execute(app_compile_nodbupdate)
    execute(app_db_update)
    # tests()
    execute(app_reload)
    execute(webservers_reload)


@task
def app_compile_nodbupdate():
    """Separated mostly for tests, which need to run alembic manually"""
    sanitize_env()
    if using_virtuoso():
        execute(install_or_updgrade_virtuoso)
    execute(app_setup)
    execute(compile_stylesheets)
    execute(compile_messages)
    execute(compile_javascript)

@task
def webservers_reload():
    """
    Reload the webserver stack.
    """
    sanitize_env()
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


def install_bower():
    with cd(get_node_base_path()):
        venvcmd('npm install bower po2json requirejs', chdir=False)


def update_bower():
    with cd(get_node_base_path()):
        venvcmd('npm update bower po2json', chdir=False)

def get_node_base_path():
    return normpath(join(
            env.projectpath, 'assembl', 'static', 'js'))

def get_node_modules_path():
    return normpath(join(
            get_node_base_path(), 'node_modules'))

def get_node_bin_path():
    return normpath(join(
            get_node_modules_path(), '.bin'))

def bower_cmd(cmd, relative_path='.'):
    with cd(env.projectpath):
        bower_cmd = normpath(join(get_node_bin_path(), 'bower'))
        po2json_cmd = normpath(join(get_node_bin_path(), 'po2json'))
        if not exists(bower_cmd) or not exists(po2json_cmd):
            print "Bower not present, installing..."
            execute(install_bower)
        with cd(relative_path):
            print("Running a bower command in path %s" % relative_path)
            venvcmd(' '.join(("node", bower_cmd, '--allow-root', cmd)), chdir=False)


def _bower_foreach_do(cmd):
    bower_cmd(cmd)
    bower_cmd(cmd, 'assembl/static/widget/card')
    bower_cmd(cmd, 'assembl/static/widget/session')
    bower_cmd(cmd, 'assembl/static/widget/video')
    bower_cmd(cmd, 'assembl/static/widget/vote')
    bower_cmd(cmd, 'assembl/static/widget/creativity')
    bower_cmd(cmd, 'assembl/static/widget/share')


@task
def update_bower_requirements(force_reinstall=False):
    """ Normally not called manually """
    sanitize_env()
    execute(_bower_foreach_do, 'prune')
    if force_reinstall:
        execute(_bower_foreach_do, 'install --force')
    else:
        execute(_bower_foreach_do, 'update')


@task
def update_npm_requirements(force_reinstall=False):
    """ Normally not called manually """
    sanitize_env()
    with cd(get_node_base_path()):
        if force_reinstall:
            venvcmd('npm prune', chdir=False)
            venvcmd('reinstall', chdir=False)
        else:
            venvcmd('npm update', chdir=False)


@task
def install_single_server():
    """
    Will install all assembl components on a single server
    """
    sanitize_env()
    execute(skeleton_env, None)
    execute(install_database)
    execute(install_assembl_server_deps)


@task
def install_assembl_server_deps():
    """
    Will install most assembl components on a single server, except db
    """
    sanitize_env()
    execute(skeleton_env, None)
    execute(install_assembl_deps)
    execute(install_redis)
    execute(install_memcached)


@task
def install_assembl_deps():
    """
    Will install commonly needed build deps for pip django virtualenvs.
    """
    sanitize_env()
    execute(skeleton_env, None)
    execute(install_basetools)
    execute(install_builddeps)


# # Server packages
def install_basetools():
    """
    Install required base tools
    """
    print(cyan('Installing base tools'))
    if env.mac:
        # Install Homebrew
        if not exists('/usr/local/bin/brew'):
            run('ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go/install)"')
        else:
            run("brew update")
            run("brew upgrade")
        # Standardize on brew python
        if not exists('/usr/local/bin/python'):
            run('brew install python')
        assert exists('/usr/local/bin/pip'), "Brew python should come with pip"
        path_pip = run('which pip')
        assert path_pip == '/usr/local/bin/pip',\
            "Make sure homebrew is in the bash path, got " + path_pip
        sudo('pip install virtualenv')
    else:
        sudo('apt-get install -y python-virtualenv python-pip')
        sudo('apt-get install -y git')
        # sudo('apt-get install -y gettext')


def install_builddeps():
    print(cyan('Installing compilers and required libraries'))
    print "env.hosts" + repr(env.hosts)
    if env.mac:
        run('brew install libevent')
        # may require a sudo
        if not run('brew link libevent', quiet=True):
            sudo('brew link libevent')
        run('brew install zeromq libtool libmemcached gawk')
        if not exists('/usr/local/bin/pkg-config'):
            run('brew install pkg-config')
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
        if not exists('/usr/local/lib/libiodbc.2.dylib'):
            run('brew install libiodbc')
            # may require a sudo
            if not run('brew link libiodbc', quiet=True):
                sudo('brew link libiodbc')
        if not exists('/usr/local/bin/gfortran'):
            run('brew install gcc isl')
    else:
        sudo('apt-get install -y build-essential python-dev pandoc')
        sudo('apt-get install -y automake bison flex gperf gawk')
        sudo('apt-get install -y graphviz pkg-config phantomjs')
        sudo('apt-get install -y gfortran')

        # will hopefully die soon
        sudo('apt-get install -y unixodbc-dev')
    execute(update_python_package_builddeps)


@task
def update_python_package_builddeps():
    """Install/Update python package native binary dependencies"""
    sanitize_env()
    print(cyan(
        'Installing/Updating python package native binary dependencies'))
    # For specific python packages in requirements.txt
    if env.mac:
        # Brew packages come with development headers
        pass
        # TODO: Make sure database, redis and memcached are installed
    else:
        sudo('apt-get install -y libpq-dev libmemcached-dev libzmq3-dev '
             'libxslt1-dev libffi-dev libhiredis-dev libxml2-dev libssl-dev '
             'libreadline-dev liblapack-dev libatlas-dev libblas-dev '
             'libgraphviz-dev')
        print ("We are still trying to get some requirements right for linux, "
               "See http://www.scipy.org/scipylib/building/linux.html "
               "for details.")


@task
def install_redis():
    """
    Install redis server
    """
    print(cyan('Installing redis server'))
    if env.mac:
        if not exists('/usr/local/bin/brew'):
            sudo('ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go/install)"')
        run('brew install redis')
        run('brew tap homebrew/services')
        run('brew services start redis')
    else:
        sudo('apt-get install -y redis-server')


@task
def install_memcached():
    """
    Install memcached server
    """
    print(cyan('Installing memcached'))
    if env.mac:
        if not exists('/usr/local/bin/brew'):
            sudo('ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go/install)"')
        run('brew install memcached')
        run('brew tap homebrew/services')
        run('brew services start memcached')
    else:
        sudo('apt-get install -y memcached')


@task
def start_edit_fontello_fonts():
    """Prepare to edit the fontello fonts in Fontello."""
    sanitize_env()
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
    r = requests.post("http://fontello.com",
                    files={'config': open(config_file)})
    if not r.ok:
        raise RuntimeError("Could not get the ID")
    fid = r.text
    with open(id_file, 'w') as f:
        f.write(fid)
    if (env.host_string == 'localhost'):
        import webbrowser
        webbrowser.open('http://fontello.com/' + fid)


@task
def compile_fontello_fonts():
    """Compile the fontello fonts once you have edited them in Fontello. Run start_edit_fontello_fonts first."""
    sanitize_env()
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


def database_create_virtuoso():
    execute(database_start)


@task
def check_and_create_database_user():
    """
    Create a user and a DB for the project
    """
    sanitize_env()
    with settings(warn_only=True):
        checkUser = venvcmd('assembl-pypsql -1 -u {user} -p {password} -n {host} "{command}"'.format(
            command="SELECT 1 FROM pg_roles WHERE rolname='%s'" % (env.db_user),
            python=env.venvpath + "/bin/python", password=env.db_password,
            host=env.db_host, user=env.db_user, projectpath=env.projectpath))
    if checkUser.failed:
        print(yellow("User does not exist, let's try to create it. (The error above is not problematic if the next command which is going to be run now will be successful. This next command tries to create the missing Postgres user.)"))
        run_db_command(as_venvcmd('assembl-pypsql -u {db_user} -n {host} "{command}"'.format(
            command="CREATE USER %s WITH CREATEDB ENCRYPTED PASSWORD '%s'; COMMIT;" % (
                env.db_user, env.db_password),
            db_user=system_db_user(), host=env.db_host)))
        # run_db_command("bash -c 'psql -n -d postgres -c \"CREATE USER %s WITH CREATEDB ENCRYPTED PASSWORD \\\'%s\\\';\"'" % (env.db_user, env.db_password))
    else:
        print(green("User exists and can connect"))


def database_create_postgres():
    execute(check_and_create_database_user)

    with settings(warn_only=True):
        checkDatabase = venvcmd('assembl-pypsql -1 -u {user} -p {password} -n {host} "{command}"'.format(
            command="SELECT 1 FROM pg_database WHERE datname='%s'" % (env.db_name),
            password=env.db_password, host=env.db_host, user=env.db_user))
    if checkDatabase.failed:
        print(yellow("Cannot connect to database, trying to create"))
        createDatabase = run(
        "PGPASSWORD=%s createdb --username=%s  --host=%s --encoding=UNICODE --template=template0 --owner=%s %s" % (
            env.db_password, env.db_user, env.db_host, env.db_user, env.db_name))
        if createDatabase.succeeded:
            print(green("Database created successfully!"))
    else:
        print(green("Database exists and user can connect"))



@task
def database_create():
    """Create the database for this assembl instance"""
    sanitize_env()
    if using_virtuoso():
        execute(database_create_virtuoso)
    else:
        execute(database_create_postgres)


def virtuoso_db_directory():
    return join(env.projectpath, 'var/db')


def database_dump_virtuoso():
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
    # Move to dbdumps_dir
    with settings(warn_only=True):
        move_result = run('mv %s %s' % (backup_file_path, absolute_path))
    if move_result.failed:
        print(red('Virtuoso backup did not error, but unable to move the file from %s to %s.\nYou may need to clear the file %s manually or your next backup will fail.' % (backup_file_path, absolute_path, backup_file_path)))
        exit()

    # Make symlink to latest
    with cd(env.dbdumps_dir):
        run('ln -sf %s %s' % (absolute_path, remote_db_path()))


def database_dump_postgres():
    if not exists(env.dbdumps_dir):
        run('mkdir -m700 %s' % env.dbdumps_dir)

    filename = 'db_%s.sql' % strftime('%Y%m%d')
    compressed_filename = '%s.pgdump' % filename
    absolute_path = os.path.join(env.dbdumps_dir, compressed_filename)

    # Dump
    with prefix(venv_prefix()), cd(env.projectpath):
        run('PGPASSWORD=%s pg_dump --host=%s -U%s --format=custom -b %s > %s' % (
            env.db_password,
            env.db_host,
            env.db_user,
            env.db_name,
            absolute_path))

    # Make symlink to latest
    with cd(env.dbdumps_dir):
        run('ln -sf %s %s' % (absolute_path, remote_db_path()))


@task
def database_dump():
    """
    Dumps the database on remote site
    """
    sanitize_env()
    if using_virtuoso():
        database_dump_virtuoso()
    else:
        database_dump_postgres()


@task
def database_download():
    """
    Dumps and downloads the database from the target server
    """
    sanitize_env()
    destination = join('./', get_db_dump_name())
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
    sanitize_env()
    if(env.wsginame != 'dev.wsgi'):
        put(get_db_dump_name(), remote_db_path())


@task
def database_delete():
    """
    Deletes the database instance
    """
    sanitize_env()
    if(env.is_production_env is True):
        abort(red("You are not allowed to delete the database of a production " +
                "environment.  If this is a server restore situation, you " +
                "have to temporarily declare env.is_production_env = False " +
                "in the environment"))
    if using_virtuoso():
        execute(database_delete_virtuoso)
    else:
        execute(database_delete_postgres)


def database_delete_virtuoso():
    execute(ensure_virtuoso_not_running)
    with cd(virtuoso_db_directory()):
        run('rm -f *.db *.trx *.lck *.trx *.pxa *.log')


def database_delete_postgres():
    execute(check_and_create_database_user)

    with settings(warn_only=True), hide('stdout'):
        checkDatabase = venvcmd('assembl-pypsql -1 -u {user} -p {password} -n {host} "{command}"'.format(
            command="SELECT 1 FROM pg_database WHERE datname='%s'" % (env.db_name),
            password=env.db_password, host=env.db_host, user=env.db_user))
    if not checkDatabase.failed:
        print(yellow("Cannot connect to database, trying to create"))
        deleteDatabase = run('PGPASSWORD=%s dropdb --username=%s %s' % (
            env.db_password, env.db_user, env.db_name))
        if deleteDatabase.succeeded:
            print(green("Database deleted successfully!"))
    else:
        print(green("Database does not exist"))


def database_restore_virtuoso():
    if(env.is_production_env is True):
        abort(red("You are not allowed to restore a database to a production " +
                "environment.  If this is a server restore situation, you " +
                "have to temporarily declare env.is_production_env = False " +
                "in the environment"))
    env.debug = True

    # if(env.wsginame != 'dev.wsgi'):
    #    execute(webservers_stop)
    with prefix(venv_prefix()), cd(virtuoso_db_directory()):
        venvcmd("supervisorctl stop virtuoso")
    # Drop db
    with cd(virtuoso_db_directory()), settings(warn_only=True):
        run('rm -f *.db *.trx')

    # Make symlink to latest
    # this MUST match the code in db_manage or virtuoso will refuse to restore
    restore_dump_prefix = "assembl-virtuoso-backup"
    restore_dump_name = restore_dump_prefix + "1.bp"
    with cd(virtuoso_db_directory()):
        run('cat %s > %s' % (remote_db_path(), join(virtuoso_db_directory(), restore_dump_name)))
    # Restore data
    with prefix(venv_prefix()), cd(virtuoso_db_directory()):
        venvcmd("supervisorctl stop virtuoso")
        run("%s +configfile %s +restore-backup %s" % (
            get_virtuoso_exec(), join(virtuoso_db_directory(), 'virtuoso.ini'),
        restore_dump_prefix))

    # clean up
    with cd(virtuoso_db_directory()):
        run('rm  %s' % (join(virtuoso_db_directory(), restore_dump_name)))

    execute(supervisor_process_start, 'virtuoso')


def database_restore_postgres():
    assert(env.wsginame in ('staging.wsgi', 'dev.wsgi'))
    env.debug = True

    if(env.wsginame != 'dev.wsgi'):
        execute(webservers_stop)

    # Drop db
    with settings(warn_only=True):
        dropped = run('PGPASSWORD=%s dropdb --host=%s --username=%s --no-password %s' % (
            env.db_password,
            env.db_host,
            env.db_user,
            env.db_name))

        assert dropped.succeeded or "does not exist" in dropped, \
            "Could not drop the database"

    # Create db
    execute(database_create)

    # Restore data
    with prefix(venv_prefix()), cd(env.projectpath):
        run('PGPASSWORD=%s pg_restore --host=%s --dbname=%s -U%s --schema=public %s' % (
                                                  env.db_password,
                                                  env.db_host,
                                                  env.db_name,
                                                  env.db_user,
                                                  remote_db_path())
        )

    if(env.wsginame != 'dev.wsgi'):
        execute(webservers_start)


@task
def database_restore():
    """
    Restores the database backed up on the remote server
    """
    sanitize_env()
    if using_virtuoso():
        database_restore_virtuoso()
    else:
        database_restore_postgres()


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


def setup_var_directory():
    run('mkdir -p %s' % normpath(join(env.projectpath, 'var', 'log')))
    run('mkdir -p %s' % normpath(join(env.projectpath, 'var', 'run')))
    run('mkdir -p %s' % normpath(join(env.projectpath, 'var', 'db')))


def get_virtuoso_root():
    if env.vroot == 'system':
        return '/usr/local/virtuoso-opensource' if env.mac else '/usr'
    if env.vroot[0] != '/':
        return normpath(join(env.projectpath, env.vroot))
    return env.vroot


def get_virtuoso_exec():
    virtuoso_exec = join(get_virtuoso_root(), 'bin', 'virtuoso-t')
    return virtuoso_exec

def get_supervisord_conf():
    return join(env.projectpath, "supervisord.conf")

def get_virtuoso_src():
    if env.vsrc[0] != '/':
        return normpath(join(env.projectpath, env.vsrc))
    return env.vsrc


@task
def flushmemcache():
    """
    Resetting all data in memcached
    """
    sanitize_env()
    if env.uses_memcache:
        print(cyan('Resetting all data in memcached :'))
        wait_str = "" if env.mac else "-q 2"
        run('echo "flush_all" | nc %s 127.0.0.1 11211' % wait_str)


def ensure_virtuoso_not_running():
    if not using_virtuoso():
        return
    # We do not want to start supervisord if not already running
    pidfile = join(env.projectpath, 'var/run/supervisord.pid')
    if not exists(pidfile):
        return
    pid = run('cat ' + pidfile)
    # Really running or stale?
    ps = run('ps ' + pid, quiet=True)
    if ps.failed:
        run('rm ' + pidfile)
        return
    execute(supervisor_process_stop, 'virtuoso')


def virtuoso_reconstruct_save_db(try_backup=True):
    execute(ensure_virtuoso_not_running)
    with cd(virtuoso_db_directory()):
        with settings(command_timeout=300):
            if try_backup:
                backup = run('%s +backup-dump +foreground' % (
                    get_virtuoso_exec(),), quiet=True)
                if not backup.failed:
                    return
                print "ERROR: Normal backup failed."
            # these were created by previous attempt
            run('rm -f virtuoso-temp.db virtuoso.pxa virtuoso.trx virtuoso.lck')
            run('%s +crash-dump +foreground' % (get_virtuoso_exec(),))


def virtuoso_reconstruct_restore_db(transition_6_to_7=False):
    execute(ensure_virtuoso_not_running)
    with cd(virtuoso_db_directory()):
        run('mv virtuoso.db virtuoso_backup.db')
    trflag = '+log6' if transition_6_to_7 else ''
    with cd(virtuoso_db_directory()):
        with settings(command_timeout=300):
            r = run('%s +restore-crash-dump +foreground %s' % (
                get_virtuoso_exec(), trflag), timeout=30)
    execute(supervisor_process_start, 'virtuoso')
    with cd(virtuoso_db_directory()):
        run('rm virtuoso_backup.db')


@task
def virtuoso_reconstruct_db():
    """Rebuild the virtuoso database from a backup dump."""
    sanitize_env()
    execute(database_dump)
    # Here we set a higher command_timeout env variable than default (which is 30), because the reconstruction of the database can take a long time.
    # http://docs.fabfile.org/en/1.10/usage/env.html#command-timeout
    # http://docs.fabfile.org/en/1.10/api/core/context_managers.html#fabric.context_managers.settings
    with settings(command_timeout=300):
        virtuoso_reconstruct_save_db(True)
        virtuoso_reconstruct_restore_db()
    execute(app_reload)


@task
def virtuoso_major_reconstruct_db():
    """Rebuild the virtuoso database from a crash dump. Sometimes worth running twice."""
    sanitize_env()
    execute(database_dump)
    # Here we set a higher command_timeout env variable than default (which is 30), because the reconstruction of the database can take a long time.
    # http://docs.fabfile.org/en/1.10/usage/env.html#command-timeout
    # http://docs.fabfile.org/en/1.10/api/core/context_managers.html#fabric.context_managers.settings
    with settings(command_timeout=300):
        virtuoso_reconstruct_save_db(False)
        virtuoso_reconstruct_restore_db()
    execute(app_reload)


def install_or_updgrade_virtuoso():
    with settings(warn_only=True), hide('warnings', 'stdout', 'stderr'):
        ls_cmd = run("ls %s" % get_virtuoso_exec())
        ls_supervisord_conf_cmd = run("ls %s" % get_supervisord_conf())
    if ls_cmd.failed or ls_supervisord_conf_cmd.failed:
        print(red("Virtuso not installed, installing."))
        execute(virtuoso_source_install)
    else:
        execute(virtuoso_source_upgrade)


def install_postgres():
    """
    Install a postgresql DB server
    """
    print(cyan('Installing Postgresql'))
    if env.mac:
        if not exists('/usr/local/bin/brew'):
            sudo('ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go/install)"')
        run('brew install postgresql')
        run('brew tap homebrew/services')
        run('brew services start postgres')
    else:
        sudo('apt-get install -y postgresql')


@task
def install_database():
    """
    Install the database server
    """
    sanitize_env()
    if using_virtuoso():
        install_or_updgrade_virtuoso()
    else:
        install_postgres()


@task
def virtuoso_source_upgrade():
    """Upgrades the virtuoso server.  Currently doesn't check if we are already using the latest version."""
    sanitize_env()
    # Virtuoso must be running before the process starts, so that we can
    # gracefully stop it later to ensure there is no trx file active.
    # trx files are not compatible between virtuoso versions
    supervisor_process_start('virtuoso')
    execute(virtuoso_source_install)
    # Makes sure there is no trx file with content
    supervisor_process_stop('virtuoso')
    # If we ran this, there is a strong chance we just reconfigured the ini file
    # Make sure the virtuoso.ini and supervisor.ini reflects the changes
    execute(app_setup)
    execute(supervisor_restart)

@task
def virtuoso_source_install():
    """Install the virtuoso server locally, normally not called directly (use virtuoso_source_upgrade instead)"""
    sanitize_env()
    virtuoso_root = get_virtuoso_root()
    virtuoso_src = get_virtuoso_src()
    branch = env.vbranch

    if exists(virtuoso_src):
        with cd(virtuoso_src):
            already_built = exists('binsrc/virtuoso/virtuoso-t')
            current_checkout = run('git rev-parse HEAD')
            if already_built and current_checkout == branch:
                return
            run('git fetch')
            run('git checkout ' + branch)
            new_checkout = run('git rev-parse HEAD')
            if already_built and new_checkout == current_checkout:
                return
    else:
        run('mkdir -p ' + dirname(virtuoso_src))
        virtuso_github = 'https://github.com/openlink/virtuoso-opensource.git'
        run('git clone %s %s' % (virtuso_github, virtuoso_src))
        with cd(virtuoso_src):
            run('git checkout ' + branch)
    with cd(virtuoso_src):
        if not exists(join(virtuoso_src, 'configure')):
            run('./autogen.sh')
        else:
            # Otherwise, it simply doesn't always work...
            run('make distclean')
        # This does not work if we change the path or anything else in local.ini
        # if exists(join(virtuoso_src, 'config.status')):
        #    run('./config.status --recheck')
        # else:

        conf_command = './configure --with-readline --enable-maintainer-mode --prefix ' + virtuoso_root
        if env.mac:
            # this needs to be kept up to date. I'd automate if we were keeping virtuoso
            conf_command += " --enable-openssl=/usr/local/Cellar/openssl/1.0.2g"
        run(conf_command)

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
            need_sudo = run('touch ' + virtuoso_root, quiet=True).failed
        execute(ensure_virtuoso_not_running)
        if need_sudo:
            sudo('checkinstall')
        else:
            run('make install')


def get_vendor_config():
    config = SafeConfigParser()
    vendor_config_path = normpath(join(
            env.projectpath, 'vendor_config.ini'))
    fp = StringIO()
    with settings(warn_only=True):
        get_retval = get(vendor_config_path, fp)
    if get_retval.failed:
        print yellow('No vendor ini file present at %s, skipping' % vendor_config_path)
        return config
    fp.seek(0)  # Yes, this is mandatory
    config.readfp(fp)
    return config


@task
def update_vendor_themes():
    """Update optional themes in assembl/static/css/themes/vendor"""
    sanitize_env()
    config = get_vendor_config()
    config_section_name = 'theme_repositories'
    if config.has_section(config_section_name):
        urls = []
        urls_string = config.get(config_section_name, 'git-urls')
        if urls_string:
            urls = urls_string.split(',')
        vendor_themes_path = normpath(join(
                env.projectpath, "assembl/static/css/themes/vendor"))
        print vendor_themes_path
        with settings(warn_only=True), cd(env.projectpath):
            # We do not use env.gitbranch, because in env_deb it may not match the real current branch
            current_assembl_branch_name = run('git symbolic-ref --short -q HEAD').split('\n')[0]
        for git_url in urls:
            print green("Updating %s" % git_url)
            matchobj = re.match(r'.*/(.*)\.git', git_url)
            git_dir_name = matchobj.group(1)
            git_dir_path = normpath(join(vendor_themes_path, git_dir_name))
            if is_dir(git_dir_path) is False:
                print cyan("Cloning git repository")
                with cd(vendor_themes_path):
                    run('git clone %s' % git_url)

            with cd(git_dir_path):
                current_vendor_themes_branch_name = run('git symbolic-ref --short -q HEAD').split('\n')[0]
                if current_vendor_themes_branch_name != current_assembl_branch_name:
                    print yellow("Vendor theme branch %s does not match current assembl branch %s" % (current_vendor_themes_branch_name, current_assembl_branch_name))
                    if current_assembl_branch_name in ('develop', 'master'):
                        run('git fetch --all')
                        print yellow("Changing branch to %s" % current_assembl_branch_name)
                        run('git checkout %s' % current_assembl_branch_name)
                    else:
                        print red("Branch %s not known to fabfile.  Leaving theme branch on %s" % (current_assembl_branch_name, current_vendor_themes_branch_name))
                run('git pull --ff-only')


def sanitize_env():
    """Ensure boolean and list env variables are such"""
    assert getattr(env, "ini_file", None),\
        "You must specify an environment task or a rc file"
    for name in (
            "uses_memcache ", "uses_uwsgi", "uses_apache", "uses_ngnix",
            "uses_global_supervisor", "using_virtuoso", "uses_apache",
            "uses_ngnix", "mac", "is_production_env"):
        setattr(env, name, bool(getattr(env, name, False)))
    if not isinstance(env.hosts, list):
        env.hosts = getattr(env, "hosts", "").split()


# # Server scenarios
def skeleton_env(projectpath, venvpath=None):
    """
    Minimal environement to allow git operations, apt-get and the like
    Everything not depending on a git checkout
    """
    if len(env.hosts) == 0:
        env.hosts = ['localhost']
    env.projectpath = projectpath
    env.gitrepo = getenv("GITREPO", "https://github.com/assembl/assembl.git")
    env.gitbranch = getenv("GITBRANCH", "master")

    #Are we on localhost
    if set(env.hosts) - set(['localhost']) == set():
        #WARNING:  This code will run locally, NOT on the remote server,
        # so it's only valid if we are connecting to localhost
        env.mac = system().startswith('Darwin')
    else:
        env.mac = False

    env.using_virtuoso = False


# # Server scenarios
def commonenv(projectpath, venvpath=None):
    """
    Base environment
    """
    execute(skeleton_env, projectpath, venvpath)
    env.projectname = "assembl"
    assert env.ini_file, "Define env.ini_file before calling common_env"
    # Production env will be protected from accidental database restores
    env.is_production_env = False
    if venvpath:
        env.venvpath = venvpath
    else:
        env.venvpath = join(projectpath, "venv")

    config = get_config()
    assert config

    env.sqlalchemy_url = config.get('app:assembl', 'sqlalchemy.url')
    env.db_user = config.get('app:assembl', 'db_user')
    env.db_password = config.get('app:assembl', 'db_password')
    env.db_name = config.get("app:assembl", "db_database")
    # It is recommended you keep localhost even if you have access to
    # unix domain sockets, it's more portable across different pg_hba configurations.
    env.db_host = 'localhost'
    if config.has_option("app:assembl", "db_host"):
        env.db_host = config.get("app:assembl", "db_host")

    env.vroot = config.get('virtuoso', 'virtuoso_root')
    env.vsrc = config.get('virtuoso', 'virtuoso_src')
    env.vbranch = get_config().get('virtuoso', 'virtuoso_branch')

    env.dbdumps_dir = join(projectpath, '%s_dumps' % env.projectname)


    env.uses_memcache = True
    env.uses_uwsgi = False
    env.uses_apache = False
    env.uses_ngnix = False
    # Where do we find the virtuoso binaries
    env.uses_global_supervisor = False
    env.system_db_user = None
    env.using_virtuoso = ''

    # Minimal dependencies versions


def using_virtuoso():
    if env.using_virtuoso is '':
        env.using_virtuoso = env.sqlalchemy_url.startswith('virtuoso')
    return env.using_virtuoso


def system_db_user():
    if env.system_db_user:
        return env.system_db_user
    if using_virtuoso():
        return None
    if env.mac:
        # Brew uses user
        return getuser()
    return "postgres"  # linux posgres


def run_db_command(command, *args, **kwargs):
    user = system_db_user()
    if user:
        return sudo(command, *args, user=user, **kwargs)
    else:
        return run(command, *args, **kwargs)


@task
def build_doc():
    """Build the Sphinx documentation"""
    sanitize_env()
    with cd(env.projectpath):
        run('rm -rf doc/autodoc doc/jsdoc')
        venvcmd('./assembl/static/js/node_modules/.bin/jsdoc -t ./assembl/static/js/node_modules/jsdoc-rst-template/template/ --recurse assembl/static/js/app -d ./doc/jsdoc/')
        venvcmd('env SPHINX_APIDOC_OPTIONS="members,show-inheritance" sphinx-apidoc -e -f -o doc/autodoc assembl')
        venvcmd('python assembl/scripts/make_er_diagram.py %s -o doc/er_diagram' % (env.ini_file))
        venvcmd('sphinx-build doc assembl/static/techdocs')


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

    env.hosts = ['localhost']
    execute(commonenv, projectpath, getenv('VIRTUAL_ENV', None))
    env.wsginame = "dev.wsgi"
    env.urlhost = "localhost"
    # env.user = "webapp"
    # env.home = "webapp"
    require('projectname', provided_by=('commonenv',))

    env.uses_apache = False
    env.uses_ngnix = False

    env.gitbranch = getenv("GITBRANCH", "develop")


@task
def env_testing(projectpath=None):
    """
    [ENVIRONMENT] Testing on http://jenkins.coeus.ca/ or locally.
    Testing environment, uses the testing.ini file.
    """
    if not projectpath:
        # Legitimate os.path
        projectpath = dirname(os.path.realpath(__file__))
    env.host_string = 'localhost'
    env.ini_file = 'testing.ini'
    env.pop('host_string')

    env.hosts = ['localhost']
    execute(commonenv, projectpath, getenv('VIRTUAL_ENV', None))
    env.wsginame = "dev.wsgi"
    env.urlhost = "localhost"
    require('projectname', provided_by=('commonenv',))
    env.uses_apache = False
    env.uses_ngnix = False

    env.gitbranch = getenv("GITBRANCH", "develop")

@task
def env_coeus_assembl():
    """
    [ENVIRONMENT] Production on http://assembl.coeus.ca/
    Production environment for Bluenove and Imagination for People projects
    """
    env.ini_file = 'local.ini'
    env.hosts = ['coeus.ca']
    env.wsginame = "staging.wsgi"
    env.urlhost = "assembl.coeus.ca"
    env.user = "www-data"
    env.home = "www-data"
    execute(commonenv, normpath("/var/www/assembl/"))
    require('projectname', provided_by=('commonenv',))

    env.is_production_env = True
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = getenv("GITBRANCH", "master")


@task
def env_coeus_assembl2():
    """
    [ENVIRONMENT] Staging on http://assembl2.coeus.ca/
    Main staging environment
    """
    env.ini_file = 'local.ini'
    env.hosts = ['coeus.ca']
    env.wsginame = "staging.wsgi"
    env.urlhost = "assembl2.coeus.ca"
    env.user = "www-data"
    env.home = "www-data"
    execute(commonenv, normpath("/var/www/assembl2/"))
    require('projectname', provided_by=('commonenv',))

    env.is_production_env = False
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = getenv("GITBRANCH", "develop")


@task
def env_inm_agora():
    """
    [ENVIRONMENT] Production on http://agora.inm.qc.ca/
    hosted on coeus
    INM (Institut du nouveau monde) dedicated environment
    """
    env.ini_file = 'local.ini'
    env.hosts = ['discussions.bluenove.com']
    env.wsginame = "prod.wsgi"
    env.urlhost = "agora.inm.qc.ca"
    env.user = "www-data"
    env.home = "www-data"
    execute(commonenv, normpath("/home/www/assembl_inm/"))
    require('projectname', provided_by=('commonenv',))

    env.is_production_env = True
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = getenv("GITBRANCH", "master")


@task
def env_bluenove_discussions():
    """
    [ENVIRONMENT] Production on http://discussions.bluenove.com/
    Common environment for Bluenove clients
    """
    env.ini_file = 'local.ini'
    env.hosts = ['discussions.bluenove.com']
    env.wsginame = "prod.wsgi"
    env.urlhost = "discussions.bluenove.com"
    env.user = "www-data"
    env.home = "www-data"
    execute(commonenv, normpath("/home/www/assembl_discussions_bluenove_com/"))
    require('projectname', provided_by=('commonenv',))

    env.is_production_env = True
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = getenv("GITBRANCH", "master")

@task
def env_bluenove_assembl2():
    """
    [ENVIRONMENT] Production on http://assembl2.bluenove.com/
    Common environment for Bluenove clients
    """
    env.ini_file = 'local.ini'
    env.hosts = ['assembl2.bluenove.com']
    env.wsginame = "prod.wsgi"
    env.urlhost = "assembl2.bluenove.com"
    env.user = "www-data"
    env.home = "www-data"
    execute(commonenv, normpath("/home/www/assembl2_bluenove_com/"))
    require('projectname', provided_by=('commonenv',))

    env.is_production_env = True
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = getenv("GITBRANCH", "master")

@task
def env_bluenove_agora2():
    """
    [ENVIRONMENT] Production on http://agora2.bluenove.com/
    Common environment for Bluenove european public debates
    """
    env.ini_file = 'local.ini'
    env.hosts = ['agora2.bluenove.com']
    env.wsginame = "prod.wsgi"
    env.urlhost = "agora2.bluenove.com"
    env.user = "assembl_agora2"
    env.home = "assembl_agora2"
    execute(commonenv, normpath("/home/assembl_agora2/assembl/"))
    require('projectname', provided_by=('commonenv',))

    env.is_production_env = True
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = getenv("GITBRANCH", "master")

@task
def env_paris_debat():
    """
    [ENVIRONMENT] Production on http://agora.inm.qc.ca/
    Common environment for Bluenove clients
    """
    env.ini_file = 'local.ini'
    env.hosts = ['discussions.bluenove.com']
    env.wsginame = "prod.wsgi"
    env.urlhost = "debat.paris.bluenove.com"
    env.user = "www-data"
    env.home = "www-data"
    execute(commonenv, normpath("/home/www/assembl_paris_fr/"))
    require('projectname', provided_by=('commonenv',))

    env.is_production_env = True
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = getenv("GITBRANCH", "master")


@task
def env_thecampfactory():
    """
    [ENVIRONMENT] Production on https://assembl.thecampfactory.fr/
    Common environment for Bluenove clients
    """
    env.ini_file = 'local.ini'
    env.hosts = ['assembl2.bluenove.com']
    env.wsginame = "prod.wsgi"
    env.urlhost = "assembl.thecampfactory.fr"
    env.user = "www-data"
    env.home = "www-data"
    execute(commonenv, normpath("/home/www/assembl_thecampfactory_fr/"))
    require('projectname', provided_by=('commonenv',))

    env.is_production_env = True
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = getenv("GITBRANCH", "master")


@task
def env_bel_bluenove():
    """
    [ENVIRONMENT] Production on https://bel.bluenove.com/
    Environment for Bel discussion
    """
    env.ini_file = 'local.ini'
    env.hosts = ['bel.bluenove.com']
    env.wsginame = "prod.wsgi"
    env.urlhost = "bel.bluenove.com"
    env.user = "assembl_bel"
    env.home = "assembl_bel-data"
    execute(commonenv, normpath("/home/assembl_bel/assembl/"))
    require('projectname', provided_by=('commonenv',))

    env.is_production_env = True
    env.uses_apache = False
    env.uses_ngnix = True
    env.uses_uwsgi = True
    env.gitbranch = getenv("GITBRANCH", "master")
