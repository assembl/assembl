import os
import getpass
import build
import re
from os.path import join, normpath
from .common import (
    venv, task, exists, delete_foreign_tasks, setup_var_directory, get_upload_dir,
    chgrp_rec, filter_autostart_processes, supervisor_process_stop, local_db_path, is_supervisord_running,
    get_node_base_path, is_supervisor_running, separate_pip_install, running_locally)
from ConfigParser import SafeConfigParser
from contextlib import nested


core_dependencies = [
    'yarn',
    'jq',
    'libevent',
    'zeromq',
    'libtool',
    'libmemcached',
    'gawk',
    'libxmlsec1',
    'pkg-config',
    'autoconf',
    'automake'
]


_processes_to_restart_without_backup = [
    "pserve", "celery", "changes_router",
    "source_reader"]


_processes_to_restart_with_backup = _processes_to_restart_without_backup + [
    "gulp", "webpack", "elasticsearch", "uwsgi"]


@task()
def check_brew(c):
    if not exists(c, '/usr/local/bin/brew'):
        c.run('ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"')
    c.run("brew update")
    c.run("brew upgrade")


@task()
def create_yaml(c):
    c.run("echo '_extends: mac.yaml' > invoke.yaml")


@task()
def install_core_dependencies(c):
    print 'Installing dependencies, compilers and required libraries'
    c.run('brew install %s' % ' '.join(list(core_dependencies)))
    if not c.run('brew link libevent', quiet=True):
        c.sudo('brew link libevent')


@task()
def upgrade_yarn(c):
    c.run("brew update && brew upgrade yarn")


@task()
def install_python_dependencies(c):
    if not exists(c, '/usr/local/bin/python3'):
        c.run("brew install python@2")
        c.run("brew install python")  # This installs python3
        c.run("brew install libmagic")  # needed for python-magic
        c.run('pip2 install virtualenv psycopg2 requests jinja2')
        c.run('python3 -m pip install virtualenv')


@task()
def create_venv_python_3(c):
    venv3 = os.path.join(os.getcwd(), "venvpy3")
    if exists(c, os.path.join(venv3, "bin/activate")):
        print("Found an already existing virtual env with python 3")
        return
    print("Creating a fresh virtual env with python 3")
    c.run('python3 -m virtualenv --python python3 %s' % venv3)
    c.run('chmod -R o-rwx ' + venv3)


def venv_py3(c):
    project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
    return nested(c.cd(project_prefix), c.prefix('source venv/bin/activate'))


@task()
def update_pip_requirements_mac(c, force_reinstall=False):
    """
    Update external dependencies on local.
    """
    separate_pip_install(c, 'pip-tools')
    with venv(c):
        # TODO: upgrade local dev pip to latest of py27
        c.run('pip install -U setuptools "pip<10" ')

    if force_reinstall:
        with venv(c):
            c.run("pip install --ignore-installed -r %s/requirements.txt" % (c.config.projectpath))
    else:
        mac_version = c.run("defaults read loginwindow SystemVersionStampAsString").stdout
        pycurl_mac = 'env PYCURL_SSL_LIBRARY=openssl MACOSX_DEPLOYMENT_TARGET="{mac_version}" LDFLAGS="-L/usr/local/opt/openssl/lib" CPPFLAGS="-I/usr/local/opt/openssl/include"'.format(mac_version='.'.join(mac_version.split('.', 2)[:2]))
        specials = [
            # setuptools and lxml need to be installed before compiling dm.xmlsec.binding
            ("lxml", None, None),
            # Thanks to https://github.com/pypa/pip/issues/4453 disable wheel separately.
            ("dm.xmlsec.binding", "%s --install-option='-q'", "%s --install-option='-q'"),
            ("pycurl", None, pycurl_mac + ' %s'),
        ]
        for package, wrapper, mac_wrapper in specials:
            wrapper = mac_wrapper
            separate_pip_install(c, package, wrapper)
        cmd = "pip install --no-cache-dir -r %s/requirements.txt" % (c.config.projectpath)
        with venv(c):
            c.run(cmd, warn=True)


@task()
def install_database(c):
    """
    Install a postgresql DB server
    """
    print('Installing Postgresql')
    c.run('brew install postgresql@9.6')
    c.run('brew tap homebrew/services')
    c.run('brew services start postgres')


@task()
def install_java(c):
    """Install openjdk-11-jdk. Require sudo."""
    print('Installing Java')
    c.run('brew cask install adoptopenjdk/openjdk/adoptopenjdk8')


@task()
def install_services(c):
    """
    Install redis server
    """
    print('Installing redis server')
    c.run('brew install redis', warn=True)
    c.run('brew install memcached', warn=True)
    c.run('brew tap homebrew/services')
    c.run('brew services start redis')
    c.run('brew services start memcached')


@task()
def install_single_server(c):
    """
        Will install all assembl components on a single server.
        Follow with bootstrap_from_checkout
    """
    print('Installing Assembl Server')
    check_brew(c)
    install_java(c)
    build.install_elasticsearch(c)
    install_database(c)
    install_python_dependencies(c)
    install_core_dependencies(c)
    install_services(c)
    print('Assembl Server installed')


@task()
def bootstrap_from_checkout(c, from_dump=False, dump_path=None):
    """
        Creates the virtualenv and install the app from git checkout. `from_dump` allows to load a DB dump, `dump_path` allows to set the path to the DB dump
    """
    print('Bootstraping')
    build_virtualenv(c)
    create_venv_python_3(c)
    app_update_dependencies(c, from_dump=from_dump)
    app_setup(c, from_dump=from_dump)
    build.check_and_create_database_user(c)
    app_compile_nodbupdate(c)
    build.set_file_permissions(c)
    if not from_dump:
        app_db_install(c)
    else:
        database_restore(c, from_dump=from_dump, dump_path=dump_path)
    app_reload(c)
    print('Bootstraping finished')


@task()
def update_main_code(c):
    """
    Update code and/or switch branch
    """
    print('Updating Git repository')
    with c.cd(join(c.config.projectpath)):
        c.run('git fetch')
        c.run('git checkout %s' % c.config._internal.gitbranch)
        c.run('git pull %s %s' % (c.config._internal.gitrepo, c.config._internal.gitbranch))


@task()
def update_url_metadata(c):
    path = join(c.config.projectpath, '..', 'url_metadata')
    if exists(c, path):
        print('Updating url_metadata Git repository')
        with c.cd(path):
            c.run('git pull')
        with venv_py3(c):
            c.run('python3 -m pip install -e ../url_metadata')


@task()
def build_virtualenv(c, with_setuptools=True):
    """
    Build the virtualenv
    """
    print('Creating a fresh virtualenv')
    venv = c.config.get('virtualenv', None)
    if not venv:
        if exists(c, 'venv'):
            print('The virtualenv seems to already exist, so we don\'t try to create it again')
            print('(otherwise the virtualenv command would produce an error)')
            return
        else:
            # _project_prefix is defined by Invoke at run-time
            project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
            venv = os.path.join(project_prefix, 'venv')

    setup_tools = ''
    if not with_setuptools:
        setup_tools = '--no-setuptools'
    c.run('python2 -mvirtualenv %s %s' % (setup_tools, "venv"))

    # Virtualenv does not reuse distutils.cfg from the homebrew python,
    # and that sometimes precludes building python modules.
    bcfile = "/usr/local/Frameworks/Python.framework/Versions/2.7/lib/python2.7/distutils/distutils.cfg"
    vefile = venv + "/lib/python2.7/distutils/distutils.cfg"
    sec = "build_ext"
    if exists(c, bcfile):
        brew_config = SafeConfigParser()
        brew_config.read(bcfile)
        venv_config = SafeConfigParser()
        if exists(c, vefile):
            venv_config.read(vefile)
        if (brew_config.has_section(sec) and
                not venv_config.has_section(sec)):
            venv_config.add_section(sec)
            for option in brew_config.options(sec):
                val = brew_config.get(sec, option)
                venv_config.set(sec, option, val)
            with open(vefile, 'w') as f:
                venv_config.write(f)


@task()
def update_node(c, force_reinstall=False):
    """
    Install node and npm to latest version specified. This is done inside of a virtual environment.
    """
    n_version = c.config._internal.node.version
    npm_version = c.config._internal.node.npm
    node_version_cmd_regex = re.compile(r'v' + n_version.replace('.', r'\.'))
    with venv(c, True):
        node_version_cmd_result = c.run('node --version', echo=True).stdout
    match = node_version_cmd_regex.match(str(node_version_cmd_result))
    if not match or force_reinstall:
        # Stop gulp and webpack because otherwise node may be busy
        supervisor_process_stop('dev:gulp')
        supervisor_process_stop('dev:webpack')
        with venv(c, True):
            c.run("rm -rf venv/lib/node_modules/")
            c.run("rm -f venv/bin/npm")  # remove the symlink first otherwise next command raises OSError: [Errno 17] File exists
            c.run("nodeenv --node=%s --npm=%s --python-virtualenv assembl/static/js" % (n_version, npm_version))
        upgrade_yarn(c)
        with c.cd(get_node_base_path(c)):
            with venv(c):
                c.run("npm install reinstall -g")

        build.update_npm_requirements(force_reinstall=True)
    else:
        print "Node version OK"


@task()
def app_update_dependencies(c, force_reinstall=False, from_dump=False):
    """
    Updates all python and javascript dependencies.  Everything that requires a
    network connection to update
    """
    if not from_dump:
        ensure_requirements(c)
    update_pip_requirements_mac(c, force_reinstall=force_reinstall)
    update_node(c, force_reinstall=force_reinstall)
    build.update_npm_requirements(c, force_reinstall=force_reinstall)


@task()
def app_reinstall_all_dependencies(c):
    """
    Reinstall all python and javascript dependencies.
    Usefull after a OS upgrade, node upgrade, etc.
    """
    app_update_dependencies(c, force_reinstall=True)


@task()
def app_fullupdate(c):
    """
    Full Update: Update to latest git, update dependencies and compile app.
    You need internet connectivity, and can't run this on a branch.
    """
    update_main_code(c)
    create_local_ini(c)
    app_compile(c)


@task()
def app_update(c):
    """
    Fast Update: Update to latest git, compile app but don't update requirements
    Useful for deploying hotfixes.  You need internet connectivity, and can't
    run this on a branch.
    """
    update_main_code(c)
    app_compile_noupdate(c)


@task()
def app_compile(c):
    """
    Full Update: This is what you normally run after a git pull.
    Doesn't touch git state, but updates requirements, rebuilds all
    generated files annd restarts whatever needs restarting.
    You need internet connectivity.  If you are on a plane, use
    app_compile_noupdate instead.
    """
    app_update_dependencies(c)
    app_compile_noupdate(c)


@task()
def app_compile_noupdate(c):
    """
    Fast Update: Doesn't touch git state, don't update requirements, and rebuild
    all generated files. You normally do not need to have internet connectivity.
    """
    app_compile_nodbupdate(c)
    build.app_db_update(c)
    app_reload(c)


@task()
def app_reload(c):
    """
    Restart all necessary processes after an update
    """
    if is_supervisor_running(c):
        with venv(c):
            if c.run("supervisorctl stop dev:").ok:
                c.run("supervisorctl update")
                c.run("supervisorctl restart dev:")


def ensure_requirements(c):
    "Copy the appropriate frozen requirements file into requirements.txt"
    target = c.config.frozen_requirements
    if target:
        with c.cd(c.config.projectpath):
            c.run("cp %s requirements.txt" % target)
    else:
        # TODO: Compare a hash in the generated requirements
        # with the hash of the input files, to avoid regeneration
        generate_new_requirements(c)


@task()
def generate_new_requirements(c):
    "Generate frozen requirements.txt file (with name taken from environment)."
    target = c.config.frozen_requirements or 'requirements.txt'
    with venv(c):
        c.run(" ".join(("pip-compile --output-file", target, c.config._internal.requirement_inputs)))


@task()
def app_setup(c, from_dump=False):
    """Setup the environment so the application can run"""
    with venv(c):
        c.run('pip install -e ./')
    setup_var_directory(c)
    if not exists(c, c.config._internal.ini_file):
        create_local_ini(c)
    if not from_dump:
        with venv(c):
            c.run('assembl-ini-files populate %s' % (c.config._internal.ini_file))
    with c.cd(c.config.projectpath):
        has_pre_commit = c.run('cat requirements.txt|grep pre-commit', warn=True)
        if has_pre_commit and not exists(c, join(
                c.config.projectpath, '.git/hooks/pre-commit')):
            with venv(c):
                c.run("pre-commit install")


@task()
def create_local_ini(c):
    """Replace the local.ini file with one composed from the current yaml file"""
    local_ini_path = os.path.join(c.config.projectpath, c.config._internal.ini_file)
    if exists(c, local_ini_path):
        c.run('cp %s %s.bak' % (local_ini_path, local_ini_path))
    with venv(c):
        c.run("inv common.create-local-ini")


@task()
def app_compile_nodbupdate(c):
    """Separated mostly for tests, which need to run alembic manually"""
    app_setup(c)
    build.compile_stylesheets(c)
    build.compile_messages(c)
    build.compile_javascript(c)


def app_db_install(c):
    """
    Install db the first time and fake migrations
    """
    build.database_create(c)
    with venv(c):
        c.run('assembl-db-manage %s bootstrap' % (c.config._internal.ini_file))


@task()
def database_restore(c, from_dump=False, dump_path=None):
    """
    Restores the database backed up on the local server
    """
    if not from_dump:
        assert(c.config.wsginame in ('staging.wsgi', 'dev.wsgi'))
        processes = filter_autostart_processes(_processes_to_restart_without_backup)
    else:
        processes = filter_autostart_processes(_processes_to_restart_with_backup)

    for process in processes:
        supervisor_process_stop(process)

    # Kill postgres processes in order to be able to drop tables
    # execute(postgres_user_detach)

    # Drop db
    dropped = c.run('PGPASSWORD=%s dropdb --host=%s --username=%s --no-password %s' % (
        c.config.db_password,
        c.config.db_host,
        c.config.db_user,
        c.config.db_database), warn=True, hide=True)

    assert dropped.succeeded or "does not exist" in dropped, \
        "Could not drop the database"

    # Create db
    build.database_create(c)

    # Restore data
    if dump_path:
        path = dump_path
    else:
        path = local_db_path(c)

    with venv(c), c.cd(c.config.projectpath):
        c.run('PGPASSWORD=%s pg_restore --no-owner --role=%s --host=%s --dbname=%s -U%s --schema=public %s' % (
            c.config.db_password,
            c.config.db_user,
            c.config.db_host,
            c.config.db_database,
            c.config.db_user,
            path), hide=True)

    if not is_supervisord_running():
        with venv(c):
            c.run('supervisord')


@task()
def generate_frozen_requirements(c):
    "Generate all frozen requirements file"
    c.run("inv -f assembl/configs/mac.yaml mac.generate-new-requirements")
    c.run("inv -f assembl/configs/testing.yaml mac.generate-new-requirements")
    c.run("inv -f assembl/configs/develop.yaml mac.generate-new-requirements")


@task()
def start_edit_fontello_fonts(c):
    """Prepare to edit the fontello fonts in Fontello."""
    assert running_locally(c)
    import requests
    font_dir = os.path.join(
        c.config.projectpath, 'assembl', 'static', 'css', 'fonts')
    config_file = os.path.join(font_dir, 'config.json')
    id_file = os.path.join(font_dir, 'fontello.id')
    r = requests.post(
        "http://fontello.com",
        files={'config': open(config_file)})
    if not r.ok:
        raise RuntimeError("Could not get the ID")
    fid = r.text
    with open(id_file, 'w') as f:
        f.write(fid)
    if running_locally(c):
        import webbrowser
        webbrowser.open('http://fontello.com/' + fid)


@task()
def compile_fontello_fonts(c):
    """Compile the fontello fonts once you have edited them in Fontello. Run start_edit_fontello_fonts first."""
    from zipfile import ZipFile
    assert running_locally(c)
    import requests
    from StringIO import StringIO
    font_dir = join(
        c.config.projectpath, 'assembl', 'static', 'css', 'fonts')
    id_file = os.path.join(font_dir, 'fontello.id')
    assert os.path.exists(id_file)
    with open(id_file) as f:
        fid = f.read()
    r = requests.get("http://fontello.com/%s/get" % fid)
    if not r.ok:
        raise RuntimeError("Could not get the data")
    with ZipFile(StringIO(r.content)) as data:
        for name in data.namelist():
            dirname, fname = os.path.split(name)
            dirname, subdir = os.path.split(dirname)
            if fname and (subdir == 'font' or fname == 'config.json'):
                with data.open(name) as fdata:
                    with open(join(font_dir, fname), 'wb') as ffile:
                        ffile.write(fdata.read())


delete_foreign_tasks(locals())
