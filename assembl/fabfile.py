#!/bin/env python2
# -*- coding:utf-8 -*-
"""
This file specifies how to do a number of installation tasks for Assembl.
It uses the Fabric_ (1.13) remote executor. In most projects, it is
separate from the code package, but many tasks need to be executed
in an environment when only the assembl package is available.
Some of the tasks also need to be executed before assembl is installed.
The fab command can take a path to this file with the -f flag, and this
file can also work well if invoked through a symbolic link.

.. _Fabric: http://www.fabfile.org/installing-1.x.html
"""

from __future__ import with_statement

from os import getenv
import sys
import re
from getpass import getuser
from shutil import rmtree
from time import sleep, strftime, time
from ConfigParser import ConfigParser, SafeConfigParser
from StringIO import StringIO
# Importing the "safe" os.path commands
from os import getcwd
from os.path import join, dirname, split, normpath, realpath
# Other calls to os.path rarely mostly don't work remotely. Use locally only.
import os.path
from functools import wraps
from tempfile import NamedTemporaryFile

from fabric.operations import (
    local, put, get, run, sudo as fabsudo)
from fabric.contrib.files import (exists, is_link, append)
from fabric.api import (
    abort, cd, env, execute, hide, prefix, settings, task as fab_task)
from fabric.colors import yellow, cyan, red, green
from fabric.context_managers import shell_env

# import logging
# import paramiko

# logger = logging.getLogger("paramiko")
# project_path = os.path.abspath('.')
# log_filename = os.path.join(project_path, 'paramiko.log')
# ch = logging.FileHandler(filename=log_filename)
# ch.setFormatter(logging.Formatter('%(asctime)s %(message)s'))
# logger.addHandler(ch)
# logger.setLevel(logging.DEBUG)


DEFAULT_SECTION = "DEFAULT"
_local_file = __file__
if _local_file.endswith('.pyc'):
    _local_file = _local_file[:-1]
local_code_root = dirname(dirname(realpath(_local_file)))


def sanitize_hosts(alt_env=None):
    alt_env = alt_env or env
    if not alt_env.get('hosts', None):
        public_hostname = alt_env.get("public_hostname", "localhost")
        alt_env['hosts'] = [public_hostname]
    elif not isinstance(alt_env['hosts'], list):
        alt_env['hosts'] = alt_env['hosts'].split()


def running_locally(hosts=None, alt_env=None):
    alt_env = alt_env or env
    # make sure sanitize_hosts has been called when reaching here
    hosts = hosts or alt_env['hosts']
    return set(hosts) - set(['localhost', '127.0.0.1']) == set()


def sudo(*args, **kwargs):
    sudoer = env.get("sudoer", None) or env.get("user")
    with settings(user=sudoer,
                  sudo_prefix='sudo -i -S -p \'{}\''.format(env.sudo_prompt)):
        if sudoer == "root":
            run(*args, **kwargs)
        else:
            fabsudo(*args, **kwargs)


def get_prefixed(key, alt_env=None, default=None):
    alt_env = alt_env or env
    for prefx in ('', '_', '*'):
        val = alt_env.get(prefx + key, None)
        if val:
            return val
    return default


def venv_path(alt_env=None):
    alt_env = alt_env or env
    path = alt_env.get('venvpath', None)
    if path:
        return path
    if running_locally(alt_env=alt_env):
        # Trust VIRTUAL_ENV, important for Jenkins case.
        return getenv('VIRTUAL_ENV', None)
    return join(get_prefixed('projectpath', alt_env, getcwd()), 'venv')


def code_root(alt_env=None):
    alt_env = alt_env or env
    sanitize_hosts(alt_env)
    if running_locally(alt_env=alt_env):
        return local_code_root
    else:
        if (as_bool(get_prefixed('package_install', alt_env, False))):
            return os.path.join(venv_path(alt_env), 'lib', 'python2.7', 'site-packages')
        else:
            return get_prefixed('projectpath', alt_env, getcwd())


def combine_rc(rc_filename, overlay=None):
    """Take a rc filename, load it as fabric would.

    If it specifies an _extends value, consider this file
    to be an overlay of the named file."""
    from fabric.main import load_settings
    assert os.path.exists(rc_filename), "Can't find " + rc_filename
    service_config = load_settings(rc_filename)
    if '_extends' in service_config:
        fname = service_config['_extends']
        # fname is either relative to the current rc_file,
        # or to the config directory, in that order.
        loc = os.path.join(dirname(rc_filename), fname)
        if not os.path.exists(loc):
            loc = os.path.join(local_code_root, 'assembl', 'configs', fname)
        assert os.path.exists(loc), "Can't find " + fname
        service_config = combine_rc(loc, service_config)
    if overlay is not None:
        service_config.update(overlay)
    service_config.pop('_extends', None)
    service_config.pop('', None)
    return service_config


def filter_global_names(rc_data):
    """Returns a copy of the dict with normalized key names.
    Some keys in rc files are prefixed with * or _ for ini conversion purposes,
    those are stripped. If the value is '__delete_key__',
    the pair is filtered out."""
    return {k.lstrip('*').lstrip('_'): v for (k, v) in rc_data.iteritems()
            if v != '__delete_key__'}


def as_bool(b):
    return str(b).lower() in {"1", "true", "yes", "t", "on"}


def sanitize_env():
    """Ensure boolean and list env variables are such"""
    # If the remote system is a mac you SHOULD set mac=true in your .rc file
    for name in (
            "uses_memcache", "uses_uwsgi", "uses_apache",
            "uses_global_supervisor", "uses_apache",
            "uses_nginx", "mac", "is_production_env",
            "build_docs", "can_test", "uses_bluenove_actionable"):
        # Note that we use as_bool() instead of bool(),
        # so that a variable valued "False" in the .ini
        # file is recognized as boolean False
        setattr(env, name, as_bool(getattr(env, name, False)))
    sanitize_hosts()
    # Note: normally, fab would set host_string from hosts.
    # But since we use the private name _hosts, and fallback
    # at this stage within task execution, neither env.hosts
    # nor env.host_string are set properly. Revisit with Fabric2.
    if not env.get('host_string', None):
        env.host_string = env.hosts[0]

    env.projectpath = env.get('projectpath', getcwd())
    if not env.get('venvpath', None):
        env.venvpath = venv_path()
    env.code_root = code_root()
    env.random_file = env.get('random_file', 'random.ini')
    env.dbdumps_dir = env.get('dbdumps_dir', join(
        env.projectpath, '%s_dumps' % env.get("projectname", 'assembl')))
    env.ini_file = env.get('ini_file', 'local.ini')
    env.group = env.get('group', env.user)


def load_rcfile_config():
    """Load the enviroment from the .rc file."""
    from fabric.state import env
    rc_file = env['rcfile']
    if not rc_file:
        abort("You must specify a .rc file")
    if not os.path.exists(env.rcfile):
        abort("This .rc file does not exist locally: " + rc_file)
    env.update(filter_global_names(env))
    env.update(filter_global_names(combine_rc(rc_file)))
    sanitize_env()
    env.code_root = code_root()


def fill_template(template, config, output=None, default_dir=None):
    if not os.path.exists(template):
        if not default_dir:
            default_dir = join(local_code_root, 'assembl', 'templates', 'system')
        template = join(default_dir, template)
    if not os.path.exists(template):
        raise RuntimeError("Missing template")
    config['here'] = config.get('here', os.getcwd())
    if template.endswith('.tmpl'):
        with open(template) as tmpl:
            result = tmpl.read() % config
    elif template.endswith('.jinja2'):
        from jinja2 import Environment
        env = Environment()
        with open(template) as tmpl:
            tmpl = env.from_string(tmpl.read())
        # Boolean overloading
        # Jinja should interpret 'false' as False but no:
        # https://github.com/ansible/ansible/issues/14983
        for (k, v) in config.items():
            if str(v).lower() == 'false':
                config[k] = False
            if '%(' in v:
                try:
                    config[k] = v % config
                except KeyError:
                    pass
        result = tmpl.render(config)
    else:
        raise RuntimeError("Unknown template type")
    if hasattr(output, 'write'):
        output.write(result)
    else:
        with open(output, 'w') as out:
            out.write(result)


def task(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        load_rcfile_config()
        return func(*args, **kwargs)
    return fab_task(wrapper)


def realpath(path):
    return run("python2 -c 'import os,sys;print os.path.realpath(sys.argv[1])' " + path)


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
def update_vendor_config():
    """Update the repository of the currently used config file"""
    config_file_dir = dirname(env.rcfile)
    here = dirname(dirname(__file__))
    if config_file_dir.startswith(here):
        config_file_dir = config_file_dir[len(here) + 1:]
    while config_file_dir:
        if os.path.exists(os.path.join(config_file_dir, '.git')):
            break
        config_file_dir = dirname(config_file_dir)
    if config_file_dir:
        # Only a subdir of the current directory
        from os import system
        # Run locally
        system("cd %s ; git pull" % config_file_dir)


@task
def create_local_ini():
    """Replace the local.ini file with one composed from the current .rc file"""
    if not running_locally():
        execute(update_vendor_config)
    random_ini_path = os.path.join(env.projectpath, env.random_file)
    local_ini_path = os.path.join(env.projectpath, env.ini_file)
    if exists(local_ini_path):
        run('cp %s %s.bak' % (local_ini_path, local_ini_path))

    if running_locally([env.host_string]):
        # The easy case: create a local.ini locally.
        venvcmd("python2 -m assembl.scripts.ini_files compose -o %s %s" % (
            env.ini_file, env.rcfile))
    else:
        # Create a local.ini file on the remote server
        # without disturbing local random/local.ini files.

        # OK, this is horrid because I need the local venv.
        local_venv = env.get("local_venv", "./venv")
        assert os.path.exists(local_venv + "/bin/python2"),\
            "No usable local venv"
        # get placeholder filenames
        with NamedTemporaryFile(delete=False) as f:
            random_file_name = f.name
        with NamedTemporaryFile(delete=False) as f:
            local_file_name = f.name
        try:
            # remote server case
            # Load the random file if any in a temp file
            if exists(random_ini_path):
                get(random_ini_path, random_file_name)
            rt = os.path.getmtime(random_file_name)
            # create the local.ini in a temp file
            with settings(host_string="localhost", venvpath=local_venv,
                          user=getuser(), projectpath=os.getcwd()):
                venvcmd("python2 -m assembl.scripts.ini_files compose -o %s -r %s %s" % (
                    local_file_name, random_file_name, env.rcfile))
            # send the random file if changed
            if rt != os.path.getmtime(random_file_name):
                put(random_file_name, random_ini_path)
            # send the local file
            put(local_file_name, local_ini_path)
        finally:
            os.unlink(random_file_name)
            os.unlink(local_file_name)


def get_random_templates():
    templates = [r for r in env.get('ini_files', '').split()
                 if r.startswith('RANDOM')]
    assert len(templates) == 1, \
        "Please define a RANDOM phase in ini_files"
    return templates[0].split(':')[1:]


def ensure_pip_compile():
    if not exists(env.venvpath + "/bin/pip-compile"):
        separate_pip_install('pip-tools')


@task
def generate_new_requirements():
    "Generate frozen requirements.txt file (with name taken from environment)."
    ensure_pip_compile()
    target = env.frozen_requirements or 'requirements.txt'
    venvcmd(" ".join(("pip-compile --output-file", target, env.requirement_inputs)))


@task
def ensure_requirements():
    "Copy the appropriate frozen requirements file into requirements.txt"
    target = env.frozen_requirements
    if target:
        with cd(env.projectpath):
            run("cp %s requirements.txt" % target)
    else:
        # TODO: Compare a hash in the generated requirements
        # with the hash of the input files, to avoid regeneration
        generate_new_requirements()


@task
def generate_frozen_requirements():
    "Generate all frozen requirements file"
    local_venv = env.get("local_venv", "./venv")
    with settings(host_string="localhost", venvpath=local_venv,
                  user=getuser(), projectpath=os.getcwd()):
        venvcmd("fab -c assembl/configs/local_prod.rc generate_new_requirements")
        venvcmd("fab -c assembl/configs/testing.rc generate_new_requirements")
        venvcmd("fab -c assembl/configs/develop.rc generate_new_requirements")
        # TODO: Check that no package has different versions in different files.


@task
def migrate_local_ini():
    """Generate a .rc file to match the existing local.ini file.
    (requires a base .rc file)

    This should be used only once,
    to migrate from a hand-crafted local.ini to the new generated
    local.ini system."""
    random_ini_path = os.path.join(env.projectpath, env.random_file)
    local_ini_path = os.path.join(env.projectpath, env.ini_file)
    dest_path = env.rcfile + '.' + str(time())

    if env.host_string == 'localhost':
        # The easy case
        # first protect or generate the random data
        if not exists(random_ini_path):
            # Create a random.ini from specified random*.tmpl files.
            templates = get_random_templates()
            venvcmd("python2 -m assembl.scripts.ini_files combine -o " +
                    random_ini_path + " " + " ".join(templates))
        # Note: we do not handle the case of an existing but incomplete
        # random.ini file. migrate is designed to be run only once.
        venvcmd("python2 -m assembl.scripts.ini_files diff -e -o %s %s %s" % (
                random_ini_path, random_ini_path, local_ini_path))
        venvcmd("python2 -m assembl.scripts.ini_files migrate -o %s %s " % (
            dest_path, env.rcfile))
    else:
        # OK, this is horrid because I need the local venv.
        local_venv = env.get("local_venv", "./venv")
        assert os.path.exists(local_venv + "/bin/python2"),\
            "No usable local venv"
        # get placeholder filenames
        with NamedTemporaryFile(delete=False) as f:
            base_random_file_name = f.name
        with NamedTemporaryFile(delete=False) as f:
            dest_random_file_name = f.name
        with NamedTemporaryFile(delete=False) as f:
            local_file_name = f.name
        try:
            # remote server case
            # Load the random file if any in a temp file
            has_random = exists(random_ini_path)
            if has_random:
                # Backup the random file
                run("cp %s %s.%d" % (
                    base_random_file_name, base_random_file_name,
                    int(time())))
                get(random_ini_path, base_random_file_name)
            get(local_ini_path, local_file_name)
            # ??? should be base_random_file_name
            with settings(host_string="localhost", venvpath=local_venv,
                          user=getuser(), projectpath=os.getcwd()):
                if not has_random:
                    templates = get_random_templates()
                    venvcmd("python2 -m assembl.scripts.ini_files combine -o " +
                            base_random_file_name + " " + " ".join(templates))
                # Create the new random file with the local.ini data
                venvcmd("python2 -m assembl.scripts.ini_files diff -e -o %s %s %s" % (
                        dest_random_file_name, base_random_file_name,
                        local_file_name))
                # Create the new rc file.
                venvcmd("python2 -m assembl.scripts.ini_files migrate -o %s -i %s -r %s %s" % (
                        dest_path, local_file_name, dest_random_file_name,
                        env.rcfile))
            # Overwrite the random file
            put(dest_random_file_name, random_ini_path)
        finally:
            os.unlink(base_random_file_name)
            os.unlink(dest_random_file_name)
            os.unlink(local_file_name)


@task
def supervisor_restart():
    "Restart supervisor itself."
    with hide('running', 'stdout'):
        venvcmd("supervisorctl shutdown")
    while True:
        sleep(5)
        result = venvcmd("supervisorctl status", warn_only=True)
        if not result.failed:
            break
        # otherwise still in shutdown mode
    # Another supervisor, upstart, etc may be watching it, give it more time
    sleep(5)
    result = venvcmd("supervisorctl status")
    if "no such file" in result:
        venvcmd("supervisord")


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


def filter_autostart_processes(processes):
    return [p for p in processes
            if as_bool(env.get('supervisor__autostart_' + p, False))]


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
                "celery_notify", "celery_notify_beat", "source_reader", "urlmetadata"])
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


def venvcmd(cmd, chdir=True, user=None, pty=False, **kwargs):
    if not user:
        user = env.user
    return run(as_venvcmd(cmd, chdir), pty=pty, **kwargs)


def as_venvcmd_py3(cmd, chdir=False):
    cmd = '. %s/bin/activate && %s' % (env.venvpath + 'py3', cmd)
    if chdir:
        cmd = 'cd %s && %s' % (env.projectpath, cmd)
    return cmd


def venvcmd_py3(cmd, chdir=True, user=None, pty=False, **kwargs):
    if not user:
        user = env.user
    return run(as_venvcmd_py3(cmd, chdir), pty=pty, **kwargs)


def venv_prefix():
    return '. %(venvpath)s/bin/activate' % env


def get_db_dump_name():
    return 'assembl-backup.pgdump'


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
    print(cyan('Creating a fresh virtualenv'))
    assert env.venvpath
    # This relies on env.venvpath
    if exists(join(env.venvpath, "bin/activate")):
        print(cyan('The virtualenv seems to already exist, so we don\'t try to create it again'))
        print(cyan('(otherwise the virtualenv command would produce an error)'))
        return
    run('python2 -mvirtualenv --no-setuptools %(venvpath)s' % env)
    # create the virtualenv with --no-setuptools to avoid downgrading setuptools that may fail
    if env.uses_bluenove_actionable:
        execute(install_bluenove_actionable)

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


@task
def build_virtualenv_python3():
    """
    Build the virtualenv with Python 3
    """
    if env.mac and not exists('/usr/local/bin/python3'):
        # update brew
        if not exists('/usr/local/bin/brew'):
            run('ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"')
        run("brew update")
        run("brew upgrade")
        run("brew install python@2")
        run("brew install python")  # This installs python3
        run("brew install libmagic")  # needed for python-magic
        run('pip3 install virtualenv')

    print(cyan('Creating a fresh virtualenv with Python 3'))
    assert env.venvpath
    # This relies on env.venvpath
    venv3 = env.venvpath + 'py3'
    if exists(join(venv3, "bin/activate")):
        print(cyan('The virtualenv seems to already exist, so we don\'t try to create it again'))
        print(cyan('(otherwise the virtualenv command would produce an error)'))
        return
    run('python3 -mvirtualenv --python python3 %s' % venv3)


@task
def install_url_metadata_source():
    "Install url_metadata in venv3 as source, for development"
    execute(build_virtualenv_python3)
    if not exists("%(projectpath)s/../url_metadata" % env):
        print cyan("Cloning git repository")
        with cd("%(projectpath)s/.." % env):
            run('git clone git://github.com/assembl/url_metadata.git')
    venvcmd_py3('pip install -e ../url_metadata')


@task
def install_url_metadata_wheel():
    "Install url_metadata in venv3 as a wheel."
    execute(build_virtualenv_python3)
    # Temporary, until we have our own wheelhouse
    venvcmd_py3('pip install -U https://github.com/assembl/url_metadata/releases/download/0.0.1/url_metadata-0.0.1-py3-none-any.whl')


def separate_pip_install(package, wrapper=None):
    template = "egrep '^%%s' %(projectpath)s/requirements-prod.frozen.txt | sed -e 's/#.*//' | xargs %(venvpath)s/bin/pip install" % env
    cmd = template % (package,)
    if wrapper:
        cmd = wrapper % (cmd,)
    run(cmd)


@task
def update_pip_requirements(force_reinstall=False):
    """
    update external dependencies on remote host
    """
    print(cyan('Updating requirements using PIP'))
    venvcmd('pip install -U setuptools "pip<10" ')

    if force_reinstall:
        run("%(venvpath)s/bin/pip install --ignore-installed -r %(projectpath)s/requirements.txt" % env)
    else:
        specials = [
            # setuptools and lxml need to be installed before compiling dm.xmlsec.binding
            ("lxml", None),
            # Thanks to https://github.com/pypa/pip/issues/4453 disable wheel separately.
            ("dm.xmlsec.binding", "%s --install-option='-q'"),
        ]
        for package, wrapper in specials:
            separate_pip_install(package, wrapper)
        cmd = "%(venvpath)s/bin/pip install -r %(projectpath)s/requirements.txt" % env
        run("yes w | %s" % cmd)


@task
def app_db_update():
    """
    Migrates database using south
    """
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
    cmd = "python2 setup.py extract_messages"
    venvcmd(cmd)
    cmd = "python2 setup.py update_catalog"
    venvcmd(cmd)


@task
def compile_messages():
    """
    Run compile *.mo file from *.po
    """
    cmd = "python2 setup.py compile_catalog"
    venvcmd(cmd)
    venvcmd("python2 assembl/scripts/po2json.py")


@task
def compile_stylesheets():
    """
    Generate *.css files from *.scss
    """
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
    with cd(env.projectpath):
        with cd('assembl/static/js'):
            venvcmd('./node_modules/.bin/gulp libs', chdir=False)
            venvcmd('./node_modules/.bin/gulp browserify:prod', chdir=False)
            venvcmd('./node_modules/.bin/gulp build:test', chdir=False)
        if env.wsginame != 'dev.wsgi':
            with cd('assembl/static2'):
                venvcmd('npm run build', chdir=False)


@task
def compile_javascript_tests():
    """Generates unified javascript test file"""
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
    # env.projectname = "assembl"
    assert projectpath, "projectpath is mandatory, and corresponds to the directory where assembl will be installed"

    with settings(projectpath=projectpath):
        execute(clone_repository)
        execute(bootstrap_from_checkout)


@task
def bootstrap_from_checkout(backup=False):
    """
    Creates the virtualenv and install the app from git checkout
    """
    execute(updatemaincode, backup=backup)
    execute(build_virtualenv)
    if getenv('TRAVIS_COMMIT', None):
        pass
    elif env.is_production_env:
        execute(install_url_metadata_wheel)
    else:
        execute(install_url_metadata_source)
    execute(app_update_dependencies, backup=backup)
    execute(app_setup)
    execute(check_and_create_database_user)
    execute(app_compile_nodbupdate)
    execute(set_file_permissions)
    if not backup:
        execute(app_db_install)
    else:
        execute(database_restore, backup=backup)
    execute(app_reload)
    execute(webservers_reload)


@task
def bootstrap_from_backup(backup=True):
    """
    Creates the virtualenv and install the app from the backup files
    """
    execute(bootstrap_from_checkout, backup=backup)


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


def updatemaincode(backup=False):
    """
    Update code and/or switch branch
    """
    if not backup:
        print(cyan('Updating Git repository'))
        with cd(join(env.projectpath)):
            run('git fetch')
            run('git checkout %s' % env.gitbranch)
            run('git pull %s %s' % (env.gitrepo, env.gitbranch))

        if not env.is_production_env and not getenv('TRAVIS_COMMIT', None):
            path = join(env.projectpath, '..', 'url_metadata')
            if exists(path):
                print(cyan('Updating url_metadata Git repository'))
                with cd(path):
                    run('git pull')
                venvcmd_py3('pip install -e ../url_metadata')


def get_robot_machine():
    """
    Return the configured robot machine: (the first configured machine)
    """
    # Retrieve the list of registered machines
    # Machines format: machine_id,machine_name,machine_password/...others
    machines = env.get('machines', '')
    if machines:
        # Get the first machine
        robot = machines.split('/')[0]
        # Retrieve the machine data
        robot_data = robot.split(',')
        # We must find three data (identifier, name and password)
        if len(robot_data) != 3:
            print red("The data of the user machine are wrong! %s" % robot)
            return None

        return {
            'identifier': robot_data[0].strip(),
            'name': robot_data[1].strip(),
            'password': robot_data[2].strip()
        }

    print red("No user machine found!")
    return None


@task
def install_bluenove_actionable():
    """
    Install the bluenove_actionable app.
    """
    if not exists("%(projectpath)s/../bluenove-actionable/" % env):
        print cyan("Cloning git bluenove-actionable repository")
        with cd("%(projectpath)s/.." % env):
            # We need an ssh access
            run('git clone git@github.com:bluenove/bluenove-actionable.git')

        with cd("%(projectpath)s/../bluenove-actionable/" % env):
            run('mkdir -p data && chmod o+rwx data')
            run('docker-compose build', warn_only=True)


@task
def update_bluenove_actionable():
    """
    Update the bluenove_actionable app. Updating the Git repository and building.
    """
    path = join(env.projectpath, '..', 'bluenove-actionable')
    if exists(path):
        print(cyan('Updating bluenove-actionable Git repository'))
        with cd(path):
            # We need an ssh access
            run('git pull')
            run('docker system prune --volumes -f', warn_only=True)
            run('mkdir -p data && chmod o+rwx data')
            run('docker-compose build --no-cache', warn_only=True)
            execute(restart_bluenove_actionable)


@task
def stop_bluenove_actionable():
    """
    Stop the bluenove_actionable app.
    """
    path = join(env.projectpath, '..', 'bluenove-actionable')
    if exists(path):
        print(cyan('Stop bluenove-actionable'))
        with cd(path):
            run('docker-compose down', warn_only=True)


@task
def start_bluenove_actionable():
    """
    Start the bluenove_actionable app.
    To start the application we need three environment variables:
    - URL_INSTANCE: The URL of the Assembl Instance.
    - ROBOT_IDENTIFIER: The identifier of the Robot user (a machine).
    - ROBOT_PASSWORD: The password of the Robot user.
    If the Robot user is not configured, we can't start the bluenove_actionable app.
    For more information, see the docker-compose.yml file in the bluenove_actionable project.
    """
    path = join(env.projectpath, '..', 'bluenove-actionable')
    robot = get_robot_machine()
    if exists(path) and robot:
        print(cyan('run bluenove-actionable'))
        url_instance = env.public_hostname
        if url_instance == 'localhost':
            ip = run("/sbin/ip -o -4 addr list eth0 | awk '{print $4}' | cut -d/ -f1")
            url_instance = 'http://{}:{}'.format(ip, env.public_port)
        with cd(path):
            with shell_env(
                URL_INSTANCE=url_instance,
                ROBOT_IDENTIFIER=robot.get('identifier'),
                ROBOT_PASSWORD=robot.get('password')
            ):
                run('docker-compose up -d', warn_only=True)


@task
def restart_bluenove_actionable():
    """
    Restart the bluenove_actionable app. Stop then start the app.
    """
    execute(stop_bluenove_actionable)
    execute(start_bluenove_actionable)


@task
def app_setup():
    "Setup the environment so the application can run"
    venvcmd('pip install -e ./')
    execute(setup_var_directory)
    if not exists(env.ini_file):
        execute(create_local_ini)
    venvcmd('assembl-ini-files populate %s' % (env.ini_file))
    with cd(env.projectpath):
        has_pre_commit = run('cat requirements.txt|grep pre-commit', warn_only=True)
        if has_pre_commit and not exists(join(
                env.projectpath, '.git/hooks/pre-commit')):
            venvcmd("pre-commit install")


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
def app_update_dependencies(force_reinstall=False, backup=False):
    """
    Updates all python and javascript dependencies.  Everything that requires a
    network connection to update
    """
    if not backup:
        execute(update_vendor_themes_1)
        execute(update_vendor_themes_2)
        execute(ensure_requirements)
    execute(update_pip_requirements, force_reinstall=force_reinstall)
    # Nodeenv is installed by python , so this must be after update_pip_requirements
    execute(update_node, force_reinstall=force_reinstall)
    # bower is installed by node, so this must be after update_node
    execute(update_bower)
    execute(update_bower_requirements, force_reinstall=force_reinstall)
    execute(update_npm_requirements, force_reinstall=force_reinstall)


@task
def app_reinstall_all_dependencies():
    """
    Reinstall all python and javascript dependencies.
    Usefull after a OS upgrade, node upgrade, etc.
    """
    execute(app_update_dependencies, force_reinstall=True)


@task
def update_node(force_reinstall=False):
    """
    Install node and npm to a known-good version
    """
    node_version_cmd_regex = re.compile('^v6\.11\.5')
    with settings(warn_only=True), hide('running', 'stdout'):
        node_version_cmd_result = venvcmd("node --version")
    match = node_version_cmd_regex.match(node_version_cmd_result)
    if not match or force_reinstall:
        print(cyan('Upgrading node'))
        # Stop gulp and webpack because otherwise node may be busy
        supervisor_process_stop('dev:gulp')
        supervisor_process_stop('dev:webpack')
        venvcmd("rm -f venv/bin/npm")  # remove the symlink first otherwise next command raises OSError: [Errno 17] File exists
        venvcmd("nodeenv --node=6.11.5 --npm=3.10.10 --python-virtualenv assembl/static/js")
        with cd(get_node_base_path()):
            venvcmd("npm install reinstall -g", chdir=False)
        with cd(get_new_node_base_path()):
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
    execute(app_update_dependencies)
    execute(app_compile_noupdate)
    if env.build_docs:
        execute(build_doc)


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
    """Separated mostly for tests, which need to run alembic manually"""
    execute(app_setup)
    execute(compile_stylesheets)
    execute(compile_messages)
    execute(compile_javascript)


@task
def app_create_wheel():
    """Create a wheel for assembl. Should be run locally."""
    execute(update_npm_requirements)
    execute(compile_stylesheets)
    execute(compile_messages)
    execute(compile_javascript)
    run("rm -rf dist build assembl.egg-info")
    venvcmd("python setup.py bdist_wheel")


@task
def generate_dh_group():
    """Generate Diffie-Hellman Group"""
    sudo("openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048")


@task
def setup_nginx_file(ready_for_production=False):
    """Creates nginx config file from template."""
    # Deleting any existing nginx configurations already existing
    if exists("/etc/nginx/sites-enabled/assembl.%s" % (env.public_hostname)):
        sudo("rm /etc/nginx/sites-enabled/assembl.%s" % (env.public_hostname))
    if exists("/etc/nginx/sites-enabled/assembl.%s" % (env.server_ip_address)):
        sudo("rm /etc/nginx.sites-enabled/assembl.%s" % (env.server_ip_address))
    rc_info = filter_global_names(combine_rc(env['rcfile']))
    fill_template('assembl/templates/system/nginx_default.jinja2', rc_info, 'assembl.%s' % (env.public_hostname))
    sudoer = env.get("sudoer", None) or env.get("user")
    with settings(user=sudoer):
        put("assembl.%s" % (env.public_hostname), "/etc/nginx/sites-available/assembl.%s" % (env.public_hostname), use_sudo=True)
    sudo("ln -s /etc/nginx/sites-available/assembl.%s /etc/nginx/sites-enabled/" % env.public_hostname)
    sudo("/etc/init.d/nginx restart")


@task
def webservers_reload():
    """
    Reload the webserver stack.
    """
    if env.uses_nginx:
        # Nginx (sudo is part of command line here because we don't have full
        # sudo access
        print(cyan("Reloading nginx"))
        if (env.get('sudo_user'), None) and exists('/etc/init.d/nginx'):
            sudo('/etc/init.d/nginx reload')
        elif exists('/etc/init.d/nginx'):
            run('sudo /etc/init.d/nginx reload')
        elif env.mac:
            sudo('killall -HUP nginx')

    if env.uses_bluenove_actionable:
        execute(restart_bluenove_actionable)
    else:
        execute(stop_bluenove_actionable)


def webservers_stop():
    """
    Stop all webservers
    """
    if env.uses_nginx:
        # Nginx
        if exists('/etc/init.d/nginx'):
            run('sudo /etc/init.d/nginx stop')
        elif env.mac:
            sudo('killall nginx')


def webservers_start():
    """
    Start all webservers
    """
    if env.uses_nginx:
        # Nginx
        if exists('/etc/init.d/nginx'):
            run('sudo /etc/init.d/nginx start')
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


def get_new_node_base_path():
    return normpath(join(
        env.projectpath, 'assembl', 'static2'))


def get_node_modules_path():
    return normpath(join(
        get_node_base_path(), 'node_modules'))


def get_new_node_modules_path():
    return normpath(join(
        get_new_node_base_path(), 'node_modules'))


def get_node_bin_path():
    return normpath(join(
        get_node_modules_path(), '.bin'))


def get_new_node_bin_path():
    return normpath(join(
        get_new_node_modules_path(), '.bin'))


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
    execute(_bower_foreach_do, 'prune')
    if force_reinstall:
        execute(_bower_foreach_do, 'install --force')
    else:
        execute(_bower_foreach_do, 'update')


@task
def update_npm_requirements(force_reinstall=False):
    """ Normally not called manually """
    with cd(get_node_base_path()):
        if force_reinstall:
            venvcmd('reinstall', chdir=False)
        else:
            venvcmd('npm update', chdir=False)

    if env.mac:
        yarn_path = '/usr/local/bin/yarn'
    else:
        yarn_path = '/usr/bin/yarn'

    static2_path = get_new_node_base_path()
    with cd(static2_path):
        if exists(yarn_path):
            if force_reinstall:
                print('Removing node_modules directory...')
                rmtree(os.path.join(static2_path, 'node_modules'))

            venvcmd(yarn_path, chdir=False)
        else:
            if force_reinstall:
                venvcmd('reinstall', chdir=False)
            else:
                venvcmd('npm update', chdir=False)


@task
def install_single_server():
    """
    Will install all assembl components on a single server.
    Follow with bootstrap_from_checkout
    """
    execute(install_java)
    execute(install_elasticsearch)
    execute(install_database)
    execute(install_assembl_server_deps)
    execute(install_redis)
    execute(install_memcached)


@task
def install_assembl_server_deps():
    """
    Will install most assembl components on a single server, except db
    """
    execute(install_yarn)
    execute(upgrade_yarn_crontab)
    execute(install_server_deps)
    execute(install_assembl_deps)


@task
def install_assembl_deps():
    """
    Will install commonly needed build deps for pip django virtualenvs.
    """
    execute(install_basetools)
    execute(install_builddeps)


@task
def install_server_deps():
    """
    Tools needed by server in order to operate securely and cleanly, but not related to Assembl
    """
    execute(install_fail2ban)


@task
def install_certbot():
    """Install letsencrypt.org certbot"""
    if env.mac:
        return
    if exists('/etc/os-release'):
        release_data = run('cat /etc/os-release')
        if 'jessie' in release_data:
            append("/etc/apt/sources.list",
                   "deb http://ftp.debian.org/debian jessie-backports main", True)
            sudo("apt-get update")
        elif 'ubuntu' in release_data:
            sudo("apt-get install software-properties-common")
            sudo("add-apt-repository ppa:certbot/certbot")
            sudo("apt-get update")
        else:
            raise NotImplementedError("Unknown distribution")
        sudo("apt-get install python-certbot-nginx")


@task
def generate_certificate():
    """Generate a certificate for https, and add renewal to crontab"""
    hostname = env.public_hostname
    if not exists('/etc/letsencrypt/live/%s/fullchain.pem' % (hostname)):
        sudo("certbot certonly --webroot -w /var/www/html -d " + hostname)
    cron_command = '12 3 * * 3 letsencrypt renew'
    sudo(create_add_to_crontab_command(cron_command))


# # Server packages
def install_basetools():
    """
    Install required base tools
    """
    print(cyan('Installing base tools'))
    if env.mac:
        # Install Homebrew
        if not exists('/usr/local/bin/brew'):
            run('ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"')
        else:
            run("brew update")
            run("brew upgrade")
        # Standardize on brew python
        if not exists('/usr/local/bin/python2'):
            run('brew install python@2')
            run('brew install python')  # This installs python3
        assert exists('/usr/local/bin/pip2'), "Brew python should come with pip"
        path_pip = run('which pip2')
        assert path_pip == '/usr/local/bin/pip2',\
            "Make sure homebrew is in the bash path, got " + path_pip
        run('pip2 install virtualenv psycopg2 requests jinja2')
        run('pip3 install virtualenv')
    else:
        sudo('apt-get install -y python-virtualenv python-pip python-psycopg2')
        sudo('apt-get install -y python-requests python-jinja2 git')
        # sudo('apt-get install -y gettext')


def install_builddeps():
    print(cyan('Installing compilers and required libraries'))
    print "env.hosts" + repr(env.hosts)
    if env.mac:
        run('brew install libevent')
        # may require a sudo
        if not run('brew link libevent', quiet=True):
            sudo('brew link libevent')
        run('brew install zeromq libtool libmemcached gawk libxmlsec1')
        if not exists('/usr/local/bin/pkg-config'):
            run('brew install pkg-config')
        if not exists('/usr/local/bin/autoconf'):
            run('brew install autoconf')
        if not exists('/usr/local/bin/automake'):
            run('brew install automake')
        if env.build_docs:
            if not exists('/usr/local/bin/twopi'):
                run('brew install graphviz')
                # may require a sudo
                if not run('brew link graphviz', quiet=True):
                    sudo('brew link graphviz')
        # glibtoolize, bison, flex, gperf are on osx by default.
        # brew does not know aclocal, autoheader...
        # They exist on macports, but do we want to install that?
    else:
        sudo('apt-get install -y build-essential python-dev pkg-config')
        sudo('apt-get install -y automake bison flex gperf gawk')
        if env.build_docs:
            sudo('apt-get install -y graphviz')
        if env.can_test:
            release_info = run("lsb_release -i")
            if "Debian" in release_info:
                sudo('apt-get install -y chromedriver', warn_only=True)  # jessie
                sudo('apt-get install -y chromium-driver', warn_only=True)  # stretch
            if "Ubuntu" in release_info:
                sudo('apt-get install -y chromium-chromedriver', warn_only=True)
    execute(update_python_package_builddeps)


@task
def update_python_package_builddeps():
    """Install/Update python package native binary dependencies"""
    # For specific python packages in requirements.txt
    if env.mac:
        # Brew packages come with development headers
        pass
    else:
        print(cyan(
            'Installing/Updating python package native binary dependencies'))
        sudo('apt-get install -y libpq-dev libmemcached-dev libzmq3-dev '
             'libxslt1-dev libffi-dev libhiredis-dev libxml2-dev libssl-dev '
             'libreadline-dev libxmlsec1-dev')
        if env.can_test:
            sudo('apt-get install -y libgraphviz-dev')


@task
def install_redis():
    """
    Install redis server
    """
    print(cyan('Installing redis server'))
    if env.mac:
        run('brew install redis')
        run('brew tap homebrew/services')
        run('brew services start redis')
    else:
        sudo('apt-get install -y redis-server')
        if exists('/etc/systemd/system/redis.service'):
            sudo('sudo systemctl start redis.service')
        elif exists('/etc/init.d/redis-server'):
            sudo('/etc/init.d/redis-server start')
        else:
            print(red("Make sure that redis is running"))


@task
def install_memcached():
    """
    Install memcached server
    """
    print(cyan('Installing memcached'))
    if env.mac:
        run('brew install memcached')
        run('brew tap homebrew/services')
        run('brew services start memcached')
    else:
        sudo('apt-get install -y memcached')
        if exists('/etc/init.d/memcached'):
            sudo('/etc/init.d/memcached start')
        else:
            print(red("Make sure that memcached is running"))


@task
def install_fail2ban():
    print(cyan('Installing fail2ban'))
    if not env.mac:
        sudo('apt-get install -y fail2ban')


def chgrp_rec(path, group, upto=None):
    parts = path.split("/")
    success = False
    for i in range(len(parts), 1, -1):
        path = "/".join(parts[:i])
        if path == upto:
            break
        if not run('chgrp {group} {path}'.format(group=group, path=path), warn_only=True).succeeded:
            break
        if not run('chmod g+x {path}'.format(path=path), warn_only=True).succeeded:
            break
        success = True
    assert success  # At least the full path


@task
def set_file_permissions():
    """Set file permissions for an isolated platform environment"""
    execute(setup_var_directory)
    webgrp = '_www' if env.mac else 'www-data'
    # This should cover most cases.
    if webgrp not in run('groups').split():
        if env.mac:
            sudo('dseditgroup -o edit -a {user} -t user {webgrp}'.format(
                webgrp=webgrp, user=env.user))
        else:
            usermod_path = run('which usermod', quiet=True)
            if not usermod_path and exists('/usr/sbin/usermod'):
                usermod_path = '/usr/sbin/usermod'
            assert usermod_path, "usermod should be part of your path"
            sudo('{usermod} -a -G {webgrp} {user}'.format(
                usermod=usermod_path, webgrp=webgrp, user=env.user))
    with cd(env.projectpath):
        upload_dir = get_upload_dir()
        project_path = env.projectpath
        code_path = code_root()
        run('chmod -R o-rwx ' + project_path)
        run('chmod -R g-rw ' + project_path)
        chgrp_rec(project_path, webgrp)
        chgrp_rec(upload_dir, webgrp, project_path)

        if not (code_path.startswith(project_path)):
            run('chmod -R o-rwx ' + code_path)
            run('chmod -R g-rw ' + code_path)
            chgrp_rec(code_path, webgrp)

        run('chgrp {webgrp} . {path}/var {path}/var/run'.format(webgrp=webgrp, path=project_path))
        run('chgrp -R {webgrp} {path}/assembl/static {path}/assembl/static2'.format(webgrp=webgrp, path=code_path))
        run('chgrp -R {webgrp} {uploads}'.format(webgrp=webgrp, uploads=upload_dir))
        run('chmod -R g+rxs {path}/var/run'.format(path=project_path))
        run('chmod -R g+rxs ' + upload_dir)
        run('find {path}/assembl/static -type d -print0 |xargs -0 chmod g+rxs'.format(path=code_path))
        run('find {path}/assembl/static -type f -print0 |xargs -0 chmod g+r'.format(path=code_path))
        run('find {path}/assembl/static2 -type d -print0 |xargs -0 chmod g+rxs'.format(path=code_path))
        run('find {path}/assembl/static2 -type f -print0 |xargs -0 chmod g+r'.format(path=code_path))
        # allow postgres user to use pypsql
        run('chmod go+x {path}/assembl/scripts'.format(path=code_path))
        run('chmod go+r {path}/assembl/scripts/pypsql.py'.format(path=code_path))


@task
def start_edit_fontello_fonts():
    """Prepare to edit the fontello fonts in Fontello."""
    assert running_locally()
    import requests
    font_dir = join(
        env.projectpath, 'assembl', 'static', 'css', 'fonts')
    config_file = join(font_dir, 'config.json')
    id_file = join(font_dir, 'fontello.id')
    r = requests.post(
        "http://fontello.com",
        files={'config': open(config_file)})
    if not r.ok:
        raise RuntimeError("Could not get the ID")
    fid = r.text
    with open(id_file, 'w') as f:
        f.write(fid)
    if running_locally([env.host_string]):
        import webbrowser
        webbrowser.open('http://fontello.com/' + fid)


@task
def compile_fontello_fonts():
    """Compile the fontello fonts once you have edited them in Fontello. Run start_edit_fontello_fonts first."""
    from zipfile import ZipFile
    assert running_locally()
    import requests
    font_dir = join(
        env.projectpath, 'assembl', 'static', 'css', 'fonts')
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


@task
def check_and_create_database_user(host=None, user=None, password=None):
    """
    Create a user and a DB for the project
    """
    host = host or env.db_host
    user = user or env.db_user
    password = password or env.db_password
    pypsql = join(code_root(), 'assembl', 'scripts', 'pypsql.py')
    with settings(warn_only=True):
        checkUser = run('python2 {pypsql} -1 -u {user} -p {password} -n {host} "{command}"'.format(
            command="SELECT 1 FROM pg_roles WHERE rolname='%s'" % (user),
            pypsql=pypsql, password=password, host=host, user=user))
    if checkUser.failed:
        print(yellow("User does not exist, let's try to create it. (The error above is not problematic if the next command which is going to be run now will be successful. This next command tries to create the missing Postgres user.)"))
        db_user = system_db_user()
        if (running_locally([host]) or env.host_string == host) and db_user:
            db_password_string = ''
            sudo_user = db_user
        else:
            db_password = env.get('postgres_db_password', None)
            assert db_password is not None, "We need a password for postgres on " + host
            db_password_string = "-p '%s'" % db_password
            sudo_user = None
        run_db_command('python2 {pypsql} -u {db_user} -n {host} {db_password_string} "{command}"'.format(
            command="CREATE USER %s WITH CREATEDB ENCRYPTED PASSWORD '%s'; COMMIT;" % (
                user, password),
            pypsql=pypsql, db_user=db_user, host=host, db_password_string=db_password_string),
            sudo_user)
    else:
        print(green("User exists and can connect"))


@task
def check_and_create_sentry_database_user():
    "Create a database user for sentry database"
    user = env.sentry_db_user
    password = env.sentry_db_password
    host = env.get("sentry_db_host", None)
    assert user and password, "Please specify sentry database user + password"
    check_and_create_database_user(host, user, password)


@task
def create_sentry_project():
    """Create a project for the current assembl server.
    Mostly useful for Docker. Tested on Sentry 8."""
    if os.path.exists(env.random_file):
        env.update(as_rc(env.random_file))
    if env.get("sentry_key", None) and env.get("sentry_secret", None):
        return
    import requests
    from ConfigParser import RawConfigParser
    assert env.sentry_host, env.sentry_api_token
    headers = {"Authorization": "Bearer " + env.sentry_api_token}
    organization = env.get("sentry_organization", "sentry")
    team = env.get("sentry_team", "sentry")
    base = "{scheme}://{host}:{port}/api/0/".format(
        scheme='https' if as_bool(env.get("sentry_is_secure", False)) else 'http',
        port=env.get("sentry_port", "80"),
        host=env.sentry_host)
    slug = "_".join(env.public_hostname.lower().split("."))
    projects_url = "{base}teams/{organization}/{team}/projects/".format(
        base=base, organization=organization, team=team)
    r = requests.get(projects_url, headers=headers)
    assert r, "Could not access sentry"
    project_slugs = [p['slug'] for p in r.json()]
    if slug not in project_slugs:
        r = requests.post(projects_url, headers=headers, json={
            "name": env.public_hostname,
            "slug": slug})
        assert r
    key_url = "{base}projects/{organization}/{slug}/keys/".format(
        base=base, organization=organization, slug=slug)
    r = requests.get(key_url, headers=headers)
    assert r
    keys = r.json()
    assert len(keys), "No key defined?"
    default = [k for k in keys if k["label"] == "Default"]
    if default:
        key = default[0]
    else:
        key = keys[0]
    # This should ideally go in the .rc file, but fab should not write rc files.
    # putting it in the local random file for now.
    parser = RawConfigParser()
    parser.optionxform = str
    if os.path.exists(env.random_file):
        parser.read(env.random_file)
    parser.set(DEFAULT_SECTION, "sentry_key", key["public"])
    parser.set(DEFAULT_SECTION, "sentry_secret", key["secret"])
    parser.set(DEFAULT_SECTION, "sentry_id", key["projectId"])
    with open(env.random_file, 'w') as f:
        parser.write(f)


def check_if_database_exists():
    with settings(warn_only=True):
        checkDatabase = venvcmd('assembl-pypsql -1 -u {user} -p {password} -n {host} "{command}"'.format(
            command="SELECT 1 FROM pg_database WHERE datname='%s'" % (env.db_database),
            password=env.db_password, host=env.db_host, user=env.db_user))
        return not checkDatabase.failed


def check_if_db_tables_exist():
    with settings(warn_only=True):
        checkDatabase = venvcmd('assembl-pypsql -1 -u {user} -p {password} -n {host} -d {database} "{command}"'.format(
            command="SELECT count(*) from permission", database=env.db_database,
            password=env.db_password, host=env.db_host, user=env.db_user))
        return not checkDatabase.failed


def check_if_first_user_exists():
    with settings(warn_only=True):
        checkDatabase = venvcmd('assembl-pypsql -1 -u {user} -p {password} -n {host} -d {database} "{command}"'.format(
            command="SELECT count(*) from public.user", database=env.db_database,
            password=env.db_password, host=env.db_host, user=env.db_user))
        return not checkDatabase.failed and int(checkDatabase.strip('()L,')) > 0


@task
def database_create():
    """Create the database for this assembl instance"""
    execute(check_and_create_database_user)

    if not check_if_database_exists():
        print(yellow("Cannot connect to database, trying to create"))
        createDatabase = venvcmd(
            'assembl-pypsql --autocommit -u {user} -p {password} -n {host}'
            ' "CREATE DATABASE {database} WITH OWNER = {user} TEMPLATE = template0 ENCODING = UNICODE"'.format(
                user=env.db_user, password=env.db_password, host=env.db_host,
                database=env.db_database))
        if createDatabase.succeeded:
            print(green("Database created successfully!"))
    else:
        print(green("Database exists and user can connect"))


@task
def rotate_database_dumps(dry_run=False):
    """Rotate database backups for real"""
    try:
        from executor.contexts import LocalContext, RemoteContext
        from rotate_backups import RotateBackups, Location
        import rotate_backups
        import coloredlogs
    except ImportError:
        print(red("This fab command should be run within the venv."))
        return
    rotate_backups.TIMESTAMP_PATTERN = re.compile(
        r'(?P<year>\d{4})(?P<month>\d{2})(?P<day>\d{2})')
    coloredlogs.increase_verbosity()
    rotation_scheme = {
        # same as doc/borg_backup_script/assembl_borg_backup.sh
        'daily': 7, 'weekly': 4, 'monthly': 6,
        # Plus yearly for good conscience
        'yearly': 'always'
    }
    dir = env.dbdumps_dir
    if running_locally([env.host_string]):
        ctx = LocalContext()
        dir = os.path.realpath(dir)
    else:
        ctx = RemoteContext(ssh_alias=env.host_string, ssh_user=env.user)
    location = Location(context=ctx, directory=dir)
    backup = RotateBackups(rotation_scheme, include_list=['db_*.sql.pgdump', 'db_*.bp'], dry_run=dry_run)
    backup.rotate_backups(location, False)


@task
def rotate_database_dumps_dry_run():
    """Rotate database backups dry run"""
    rotate_database_dumps(True)


@task
def database_dump():
    """
    Dumps the database on remote site
    """
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
            env.db_database,
            absolute_path))

    # Make symlink to latest
    with cd(env.dbdumps_dir):
        run('ln -sf %s %s' % (absolute_path, remote_db_path()))
    # TODO: Maybe do a rotation?


def get_upload_dir(path=None):
    path = path or env.get('upload_root', 'var/uploads')
    if path != '/':
        path = join(env.projectpath, path)
    return path


@task
def database_download():
    """
    Dumps and downloads the database from the target server
    """
    destination = join('./', get_db_dump_name())
    if is_link(destination):
        print('Clearing symlink at %s to make way for downloaded file' % (destination))
        local('rm %s' % (destination))
    execute(database_dump)
    get(remote_db_path(), destination)
    remote_path = get_upload_dir()
    rsync_path = "%s@%s:%s" % (env.user, env.host_string, remote_path)
    local_venv = env.get("local_venv", "./venv")
    with settings(host_string="localhost", venvpath=local_venv,
                  user=getuser(), projectpath=os.getcwd()):
        # TODO: I should check the local upload_path. But in practice
        # it's a developer's machine, probably uses standard.
        local_path = get_upload_dir('var/uploads')
        run("rsync -a %s/ %s" % (rsync_path, local_path))


@task
def database_upload():
    """
    Uploads a local database backup to the target environment's server
    """
    if(env.wsginame != 'dev.wsgi'):
        put(get_db_dump_name(), remote_db_path())
        remote_path = get_upload_dir()
        rsync_path = "%s@%s:%s/" % (env.user, env.host_string, remote_path)
        local_venv = env.get("local_venv", "./venv")
        with settings(host_string="localhost", venvpath=local_venv,
                      user=getuser(), projectpath=os.getcwd()):
            # TODO: I should check the local upload_path. But in practice
            # it's a developer's machine, probably uses standard.
            local_path = get_upload_dir('var/uploads')
            run("rsync -a %s/ %s" % (local_path, rsync_path))


@task
def database_delete():
    """
    Deletes the database instance
    """
    if(env.is_production_env is True):
        abort(red(
            "You are not allowed to delete the database of a production " +
            "environment.  If this is a server restore situation, you " +
            "have to temporarily declare env.is_production_env = False " +
            "in the environment"))
    execute(check_and_create_database_user)

    with settings(warn_only=True), hide('stdout'):
        checkDatabase = venvcmd('assembl-pypsql -1 -u {user} -p {password} -n {host} "{command}"'.format(
            command="SELECT 1 FROM pg_database WHERE datname='%s'" % (env.db_database),
            password=env.db_password, host=env.db_host, user=env.db_user))
    if not checkDatabase.failed:
        print(yellow("Cannot connect to database, trying to create"))
        deleteDatabase = run('PGPASSWORD=%s dropdb --host=%s --username=%s %s' % (
            env.db_password, env.postgres_db_host, env.db_user, env.db_database))
        if deleteDatabase.succeeded:
            print(green("Database deleted successfully!"))
    else:
        print(green("Database does not exist"))


@task
def postgres_user_detach():
    """Terminate the PID processes owned by the assembl user"""
    process_list = run(
        'psql -U %s -h %s -d %s -c "SELECT pid FROM pg_stat_activity where pid <> pg_backend_pid()" ' % (
            env.db_user,
            env.db_host,
            env.db_database))

    pids = process_list.split("\r\n")[2:-1:]
    for pid in pids:
        run('psql -U %s -h %s -d %s -c "SELECT pg_terminate_backend(%s);"' % (
            env.db_user,
            env.db_host,
            env.db_database,
            pid))


@task
def database_restore(backup=False):
    """
    Restores the database backed up on the remote server
    """
    if not backup:
        assert(env.wsginame in ('staging.wsgi', 'dev.wsgi'))
        processes = filter_autostart_processes([
            "dev:pserve" "celery_imap", "changes_router", "celery_notify",
            "celery_notification_dispatch", "source_reader"])
    else:
        processes = filter_autostart_processes([
            "dev:pserve", "dev:gulp", "dev:webpack", "edgesense", "elasticsearch", "celery_imap", "changes_router", "celery_notify",
            "celery_notification_dispatch", "celery_notify_beat", "celery_translate", "source_reader", "maintenance_uwsgi", "metrics",
            "metrics_py", "prod:uwsgi"])

    if(env.wsginame != 'dev.wsgi'):
        execute(webservers_stop)
        processes.append("prod:uwsgi")  # possibly not autostarted

    for process in processes:
        supervisor_process_stop(process)

    # Kill postgres processes in order to be able to drop tables
    # execute(postgres_user_detach)

    # Drop db
    with settings(warn_only=True):
        dropped = run('PGPASSWORD=%s dropdb --host=%s --username=%s --no-password %s' % (
            env.db_password,
            env.db_host,
            env.db_user,
            env.db_database))

        assert dropped.succeeded or "does not exist" in dropped, \
            "Could not drop the database"

    # Create db
    execute(database_create)

    # Restore data
    with prefix(venv_prefix()), cd(env.projectpath):
        run('PGPASSWORD=%s pg_restore --no-owner --role=%s --host=%s --dbname=%s -U%s --schema=public %s' % (
            env.db_password,
            env.db_user,
            env.db_host,
            env.db_database,
            env.db_user,
            remote_db_path())
        )

    for process in processes:
        supervisor_process_start(process)

    if(env.wsginame != 'dev.wsgi'):
        execute(webservers_start)


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
    run('mkdir -p %s' % get_upload_dir())


def get_supervisord_conf():
    return join(env.projectpath, "supervisord.conf")


@task
def flushmemcache():
    """
    Resetting all data in memcached
    """
    if env.uses_memcache:
        print(cyan('Resetting all data in memcached :'))
        wait_str = "" if env.mac else "-q 2"
        run('echo "flush_all" | nc %s 127.0.0.1 11211' % wait_str)


def as_rc(ini_filename):
    cp = SafeConfigParser()
    cp.read(ini_filename)
    r = {}
    for section in cp.sections():
        for k, v in cp.items(section):
            if k[0] in ("_*"):
                k = k[1:]
            elif section not in ('app:assembl', DEFAULT_SECTION):
                k = "__".join((section, k))
            r[k] = v
    return r


@task
def docker_compose():
    "Create configuration files needed by docker_compose"
    from jinja2 import Environment, FileSystemLoader
    assert env.docker_assembl_hosts, "Define docker_assembl_hosts"
    if not os.path.exists("./docker/build"):
        os.mkdir("./docker/build")
    else:
        pass  # TODO: Delete contents
    if not isinstance(env.docker_assembl_hosts, list):
        env.docker_assembl_hosts = env.docker_assembl_hosts.split()
    jenv = Environment(
        loader=FileSystemLoader('./docker'),
        autoescape=lambda t: False)
    rc_template = jenv.get_template('assembl_subprocess.rc.jinja2')
    compose_template = jenv.get_template('docker-compose.yml.jinja2')
    compose_stage1_template = jenv.get_template('docker-compose-stage1.yml.jinja2')
    # Get local random information to give to docker
    local_venv = env.get("local_venv", "./venv")
    assert os.path.exists(local_venv + "/bin/python2"),\
        "No usable local venv"
    if os.path.exists(env.random_file):
        env.update(as_rc(env.random_file))
    for i, hostname in enumerate(env.docker_assembl_hosts):
        rc_filename = './docker/build/assembl%d.rc' % (i + 1,)
        nginx_filename = './docker/build/nginx_%s.conf' % (hostname,)
        with open(rc_filename, 'w') as f:
            f.write(rc_template.render(
                public_hostname_=hostname, assembl_index=i + 1, **env))
        with settings(host_string="localhost", venvpath=local_venv,
                      user=getuser(), projectpath=os.getcwd()):
            venvcmd("assembl-ini-files template -o %s %s nginx_default.jinja2" % (
                nginx_filename, rc_filename))
    with open('./docker/build/docker-compose.yml', 'w') as f:
        f.write(compose_template.render(**env))
    with open('./docker/build/docker-compose-stage1.yml', 'w') as f:
        f.write(compose_stage1_template.render(**env))
    # run("docker-compose -f docker/build/docker-compose.yml up")


@task
def set_ssl_certificates():
    "Create stapled SSL certificates"
    if env.ocsp_path:
        root_certificate = run('curl https://letsencrypt.org/certs/isrgrootx1.pem.txt')
        intermediate_certificate_1 = run('curl https://letsencrypt.org/certs/lets-encrypt-x3-cross-signed.pem.txt')
        intermediate_certificate_2 = run('curl https://letsencrypt.org/certs/letsencryptauthorityx3.pem.txt')
        with open(env.ocsp_path, 'w') as certificates_file:
            for certificate_file in (root_certificate, intermediate_certificate_1, intermediate_certificate_2):
                certificates_file.write(certificate_file)
                certificates_file.write('\n')
    else:
        print(yellow("Can't set ssl certificates, env.ocsp_path is not set"))


@task
def reindex_elasticsearch(bg=False):
    "Rebuild the elasticsearch index"
    cmd = "assembl-reindex-all-contents " + env.ini_file
    if bg:
        cmd += "&"
    venvcmd(cmd)


@task
def docker_startup():
    """Startup assembl from within a docker environment.

    Verify if your database environment exists, and create it otherwise."""
    if as_bool(getenv("BUILDING_DOCKER", True)):
        return
    execute(create_sentry_project)
    if not exists(env.ini_file):
        execute(create_local_ini)
    if not exists("supervisord.conf"):
        venvcmd('assembl-ini-files populate %s' % (env.ini_file))
    # Copy the static file. This needs improvements.
    copied = False
    if not exists("/opt/assembl_static/static"):
        run("cp -rp %s/assembl/static /opt/assembl_static/" % env.projectpath)
        copied = True
    if not exists("/opt/assembl_static/static2"):
        run("cp -rp %s/assembl/static2 /opt/assembl_static/" % env.projectpath)
        copied = True
    if copied:
        run("chmod -R a+r /opt/assembl_static")
        run("find /opt/assembl_static -type d | xargs chmod a+x")
    execute(check_and_create_database_user)
    if not check_if_database_exists():
        execute(app_db_install)
    elif not check_if_db_tables_exist():
        # DB exists, maybe separate the boostrap test
        execute(app_db_install)
        execute(reindex_elasticsearch)
    else:
        execute(app_db_update)
    if not check_if_first_user_exists():
        execute(create_first_admin_user)
    venvcmd("supervisord")


@task
def create_first_admin_user():
    "Create a user with admin rights, email given in env. as first_admin_email"
    email = env.get("first_admin_email", None)
    assert email, "Please set the first_admin_email in the .rc environment"
    venvcmd("assembl-add-user -m %s -u admin -n Admin -p admin --bypass-password %s" % (
        email, env.ini_file))


@task
def install_java():
    """Install Oracle Java 8. Require sudo."""
    if getenv("IN_DOCKER"):
        return

    if env.mac:
        run("brew update")
        # run("brew install caskroom/cask/brew-cask")
        run("brew cask install java")
    else:
        release_info = run("lsb_release -i")
        if "Ubuntu" in release_info:
            sudo("add-apt-repository -y ppa:webupd8team/java")
            sudo("apt update")
            sudo("apt install -y oracle-java8-installer")
            sudo("apt install oracle-java8-set-default")
        else:  # assuming debian
            if not exists('/usr/bin/java'):
                print(red("Java 8 must be installed in order to progress. This is needed for elasticsearch."))
                print(cyan("Debian instructions to install Oracle Java 8: http://www.webupd8.org/2014/03/how-to-install-oracle-java-8-in-debian.html"))
                sys.exit(1)


@task
def install_yarn():
    """Install yarn"""
    if not env.mac:
        if not run('which yarn', warn_only=True).failed:
            return
        if not exists('/etc/apt/sources.list.d/yarn.list'):
            sudo('apt-get update')
            sudo('apt-get install apt-transport-https')
            append("/etc/apt/sources.list.d/yarn.list",
                   "deb https://dl.yarnpkg.com/debian/ stable main", True)
            sudo('curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -')
            sudo('apt-get update')
            sudo('apt-get install yarn')
    else:
        run('brew install yarn')


def create_add_to_crontab_command(crontab_line):
    """Generates a shell command that makes sure that a cron won't be added several times (thanks to sort and uniq). This makes sure adding it several times is idempotent."""
    return "(crontab -l | grep -Fv '{cron}'; echo '{cron}') | crontab -".format(cron=crontab_line)


@task
def upgrade_yarn_crontab():
    """Automate the look up for a new version of yarn and update it"""
    statement_base = "0 2 * * 1 %s"
    if env.mac:
        cmd = "brew update && brew upgrade yarn"
        statement = statement_base % cmd
        run(create_add_to_crontab_command(statement))

    else:
        cmd = "apt-get update && apt-get install --only-upgrade yarn"
        statement = statement_base % cmd
        sudo(create_add_to_crontab_command(statement))


@task
def install_elasticsearch():
    """Install elasticsearch"""
    ELASTICSEARCH_VERSION = env.elasticsearch_version
    if getenv("IN_DOCKER"):
        return

    if not env.mac:
        release_info = run("lsb_release -i")
        if "Debian" in release_info or "Ubuntu" in release_info:
            if not exists('/etc/sysctl.d/vm.max_map_count.conf'):
                # change now
                sudo("sysctl -w vm.max_map_count=262144")
                # persist the change
                append('/etc/sysctl.d/vm.max_map_count.conf',
                       'vm.max_map_count=262144', True)
        else:
            print(red("Unknown distribution"))

    base_extract_path = normpath(
        join(env.projectpath, 'var'))
    extract_path = join(base_extract_path, 'elasticsearch')
    if exists(extract_path):
        print("elasticsearch already installed")
        run('rm -rf %s' % extract_path)

    base_filename = 'elasticsearch-{version}'.format(version=ELASTICSEARCH_VERSION)
    tar_filename = base_filename + '.tar.gz'
    sha1_filename = tar_filename + '.sha1'
    with cd(base_extract_path):
        if not exists(tar_filename):
            run('curl -o {fname} https://artifacts.elastic.co/downloads/elasticsearch/{fname}'.format(fname=tar_filename))
        sha1_expected = run('curl https://artifacts.elastic.co/downloads/elasticsearch/' + sha1_filename)
        sha1_effective = run('openssl sha1 ' + tar_filename)
        if ' ' in sha1_effective:
            sha1_effective = sha1_effective.split(' ')[-1]
        assert sha1_effective == sha1_expected, "sha1sum of elasticsearch tarball doesn't match, exiting"
        run('tar zxf ' + tar_filename)
        run('rm ' + tar_filename)
        run('mv %s elasticsearch' % base_filename)

        # ensure that the folder being scp'ed to belongs to the user/group
        run('chown -R {user}:{group} {path}'.format(
            user=env.user, group=env.group,
            path=extract_path))

        # Make elasticsearch and plugin in /bin executable
        run('chmod ug+x {es} {esp} {in_sh} {sysd} {log}'.format(
            es=join(extract_path, 'bin/elasticsearch'),
            esp=join(extract_path, 'bin/elasticsearch-plugin'),
            in_sh=join(extract_path, 'bin/elasticsearch.in.sh'),
            sysd=join(extract_path, 'bin/elasticsearch-systemd-pre-exec'),
            log=join(extract_path, 'bin/elasticsearch-translog'),
        ))
        run(env.projectpath + '/var/elasticsearch/bin/elasticsearch-plugin install https://artifacts.elastic.co/downloads/elasticsearch-plugins/analysis-smartcn/analysis-smartcn-{version}.zip'.format(version=ELASTICSEARCH_VERSION))
        run(env.projectpath + '/var/elasticsearch/bin/elasticsearch-plugin install https://artifacts.elastic.co/downloads/elasticsearch-plugins/analysis-kuromoji/analysis-kuromoji-{version}.zip'.format(version=ELASTICSEARCH_VERSION))

        print(green("Successfully installed elasticsearch"))


@task
def upgrade_elasticsearch():
    "Upgrade elasticsearch to the appropriate version"
    if getenv("IN_DOCKER"):
        return

    extract_path = normpath(
        join(env.projectpath, 'var', 'elasticsearch'))
    supervisor_process_stop('elasticsearch')
    if exists(extract_path):
        # Must force write permission in the folder to be able to delete
        # it as non-root user with sudo access
        sudo("chmod -R 777 %s" % extract_path)
        sudo("rm -rf %s" % extract_path)
    execute(install_elasticsearch)
    supervisor_process_start('elasticsearch')


@task
def install_database():
    """
    Install a postgresql DB server
    """
    print(cyan('Installing Postgresql'))
    if env.mac:
        run('brew install postgresql')
        run('brew tap homebrew/services')
        run('brew services start postgres')
    else:
        sudo('apt-get install -y postgresql')
        if exists('/etc/init.d/postgresql'):
            sudo('/etc/init.d/postgresql start')
        else:
            print(red("Make sure that postgres is running"))


def install_php():
    if env.mac:
        run("brew tap homebrew/php")
        run("brew install php56 --with-apache --with-homebrew-curl")
        run("brew install php56-imagick")
        # No php-gd in homebrew
    else:
        sudo("apt-get -y install php php-mysql php-curl php-cli php-gd")


def install_mysql():
    if env.mac:
        run("brew install mysql")
        print(red("Set your root password with mysql_secure_installation"))
        print("See https://dev.mysql.com/doc/refman/5.7/en/mysql-secure-installation.html")
    else:
        # Check the env variable for all of the values required for mysql installation

        sudo("debconf-set-selections <<< 'mysql-server mysql-server/root_password password {password}".format(
            password=env.mysql_password))
        sudo("debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password {password}".format(
            password=env.mysql_password))
        sudo("apt-get -y install mysql-server")


def install_apache():
    if env.mac:
        # TODO
        # APACHE already comes pre-installed on Mac OS X El Capitan
        # Read more here:
        # https://jason.pureconcepts.net/2015/10/install-apache-php-mysql-mac-os-x-el-capitan/
        run("brew tap homebrew/apache")
        run("brew install httpd24")
    else:
        sudo("apt-get install apache2")


@task
def install_lamp():
    """
    Installs Apache2, Mysql and PHP on a Linux Environment
    """
    execute(install_mysql)
    execute(install_apache)
    execute(install_php)


@task
def uninstall_lamp():
    """
    Installs Apache2, Mysql and PHP on a Linux Environment, for dev purposes
    """
    if env.mac:
        run("brew uninstall php56-imagick php56 homebrew/apache/httpd24 mysql")
    else:
        sudo("apt-get purge apache2 mysql-server php-mysql php-curl php-cli php-gd")
        sudo("apt-get autoremove")  # Remove dangling dependencies after purging


@task
def install_piwik():
    """
    Install the entire Piwik stack on Linux systems *ONLY*
    """
    if env.mac:
        print(red("We have not setup piwik on the mac."))
        return
    execute(install_lamp())
    print(cyan("About to install Piwik"))
    print(cyan("About to configure DNS"))


@task
def uninstall_piwik():
    """
    Remove all dependencies and configurations related to Piwik on Linux
    """
    if env.mac:
        print(red("This task cannot be run on a Macintosh, you fool!"))
    else:
        execute(uninstall_lamp())


@task
def install_postfix():
    """Install postfx for SMTP."""
    assert not env.mac
    # take mail host from mail.host
    external_smtp_host = env.smtp_host
    if running_locally([external_smtp_host]):
        external_smtp_host = None
    sudo("debconf-set-selections <<< 'postfix postfix/mailname string %s'" % (env.host_string,))
    if external_smtp_host:
        sudo("debconf-set-selections <<< 'postfix postfix/main_mailer_type string \"Internet with smarthost\"'")
        sudo("debconf-set-selections <<< 'postfix postfix/relayhost string %s'" % (external_smtp_host,))
    else:
        sudo("debconf-set-selections <<< 'postfix postfix/main_mailer_type string \"Internet site\"'")
    sudo("DEBIAN_FRONTEND=noninteractive apt-get -y install postfix")


@task
def install_dovecot_vmm():
    """Install dovecot and vmm for IMAP. Assumes postfix is installed. Configuration TODO."""
    assert not env.mac
    execute(install_postfix)
    sudo("apt-get -y install dovecot-core dovecot-imapd dovecot-lmtpd"
         " dovecot-pgsql vmm postfix postfix-pgsql python-egenix-mxdatetime"
         " python-crypto libsasl2-modules libsasl2-modules-db sasl2-bin")


def update_vendor_themes(frontend_version=1):
    sanitize_env()
    assert frontend_version in (1, 2)
    frontend_version_s = '2' if frontend_version == 2 else ''
    theme_varname = "theme%s_repositories__git-urls" % frontend_version_s
    base_path = "assembl/static%s/css/themes/vendor" % frontend_version_s
    if env.get(theme_varname, None):
        urls = []
        urls_string = env.get(theme_varname)
        if urls_string:
            urls = urls_string.split(',')
        vendor_themes_path = normpath(join(
            env.projectpath, base_path))
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


@task
def update_vendor_themes_1():
    """Update optional themes in assembl/static/css/themes/vendor"""
    update_vendor_themes(1)


@task
def update_vendor_themes_2():
    """Update optional themes in assembl/static2/css/themes/vendor"""
    update_vendor_themes(2)


@task
def update_vendor_themes_and_compile():
    """Update vendor themes and compile them. Run this task when you want to deploy recent changes to themes on a server, without updating Assembl's code and dependencies."""
    execute(update_vendor_themes_1)
    execute(update_vendor_themes_2)
    execute(compile_stylesheets)  # for themes of the v1 UI
    execute(compile_javascript)  # for themes of the v2 UI


def system_db_user():
    if env.get('postgres_db_user', None):
        return env.postgres_db_user
    if env.mac:
        # Brew uses user
        return getuser()
    return "postgres"  # linux postgres


def run_db_command(command, user=None, *args, **kwargs):
    if user:
        # Unix with local postgres installation and local postgres user
        # we will sudo -u postgres to do the pypsql command
        return sudo(command, *args, user=user, **kwargs)
    else:
        # Either we have a postgres superuser we can login as,
        # Or we're postgres owner with brew.
        return run(command, *args, **kwargs)


@task
def build_doc():
    """Build the Sphinx documentation for the backend (and front-end) as well as build GraphQL documentation"""
    execute(generate_graphql_documentation)
    with cd(env.projectpath):
        run('rm -rf doc/autodoc doc/jsdoc')
        venvcmd('./assembl/static/js/node_modules/.bin/jsdoc -t ./assembl/static/js/node_modules/jsdoc-rst-template/template/ --recurse assembl/static/js/app -d ./doc/jsdoc/')
        venvcmd('env SPHINX_APIDOC_OPTIONS="members,show-inheritance" sphinx-apidoc -e -f -o doc/autodoc assembl')
        venvcmd('python2 assembl/scripts/make_er_diagram.py %s -o doc/er_diagram' % (env.ini_file))
        venvcmd('sphinx-build doc assembl/static/techdocs')


@task
def install_translation_dependencies():
    """Install core dependencies needed in order to translate objects
    in React-based Assembl"""
    if env.mac:
        run("brew install gettext; brew link --force gettext")
    else:
        sudo("apt-get install gettext")


@task
def make_new_messages():
    """Build .po files for React based instances of Assembl"""
    with cd(env.projectpath + "/assembl/static2/"):
        venvcmd('npm run i18n:export', chdir=False)


@task
def compile_new_messages():
    """Build the locale.json files from the corresponding po files"""
    with cd(env.projectpath + "/assembl/static2/"):
        venvcmd('npm run i18n:import', chdir=False)


@task
def build_po_files():
    """Build translation files for both versions of Assembl"""

    # Version 1
    execute(make_messages)
    # Version 2
    execute(make_new_messages)


@task
def build_translation_json_files():
    """Build locale json files from .po files for each locale"""

    # Version1
    execute(compile_messages)
    # Version2
    execute(compile_new_messages)


@task
def increase_socket_buffer_size(size=1028):
    """For performance tuning of Ubuntu servers in order to accomodate higher loads at peak"""
    # Increase the size of the buffer to 1028 connections
    # This number was picked based on live servers. Increase when needed
    # This must also be accompanied with an increase of the uwsgi conenction listen field in the ini file
    sudo('sysctl -w net.core.somaxconn=%s' % size)


@task
def generate_graphql_documentation():
    """Generate HTML documentation page based on a GraphQL Schema file (genereated)"""
    venvcmd('assembl-graphql-schema-json local.ini')
    with cd(env.projectpath + "/assembl/static2"):
        venvcmd("npm run documentation", chdir=False)


@task
def install_docker():
    if env.mac:
        print(green("Docker can be installed from https://store.docker.com/editions/community/docker-ce-desktop-mac"))
    else:
        if not exists('/usr/bin/docker'):
            sudo('apt-get update')
            sudo('apt-get install apt-transport-https ca-certificates curl software-properties-common')
            sudo('curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -')
            sudo('add-apt-repository -y "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"')
            sudo('apt-get update; apt-get install -y docker-ce')
            gitpath = 'https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m)'
            run('curl -L %s -o /usr/local/bin/docker-compose' % gitpath)
            sudo('chmod +x /usr/local/bin/docker-compose')
            execute(add_user_to_group, env.user, 'docker')


@task
def add_user_to_group(user, group):
    if env.mac:
        # usually local
        fabsudo("dseditgroup -o edit -a %s -t user %s" % (user, group))
    else:
        sudo("usermod -a -G %s %s" % (group, user))


@task
def set_fail2ban_configurations():
    """Utilize configurations to populate and push fail2ban configs, must be done as a sudo user"""
    if exists('/etc/fail2ban'):
        from jinja2 import Environment, FileSystemLoader
        # This is done locally
        template_folder = os.path.join(local_code_root, 'assembl', 'templates', 'system')
        jenv = Environment(
            loader=FileSystemLoader(template_folder),
            autoescape=lambda t: False)
        filters = [f for f in os.listdir(template_folder) if f.startswith('filter-')]
        filters.append('jail.local.jinja2')
        filters_to_file = {}
        for f in filters:
            with NamedTemporaryFile(delete=False) as f2:
                filters_to_file[f] = f2.name
        try:
            # populate jail and/or filters
            print("Generating template files")
            for (template_name, temp_path) in filters_to_file.items():
                with open(temp_path, 'w') as f:
                    filter_template = jenv.get_template(template_name)
                    f.write(filter_template.render(**env))

                final_name = template_name[:-7]  # remove .jinja2 extension
                final_path = '/etc/fail2ban/'
                if final_name.startswith('filter-'):
                    final_name = final_name[7:]  # Remove filter-
                    final_name += '.conf'  # add extension
                    final_path += 'filter.d/'
                final_path = join(final_path, final_name)
                put(temp_path, final_path)

        finally:
            for path in filters_to_file.values():
                os.unlink(path)
