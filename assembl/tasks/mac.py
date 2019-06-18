import os
import getpass
import build
import re
from os.path import join, normpath
from .common import (
    venv, task, exists, delete_foreign_tasks, setup_var_directory, get_upload_dir,
    chgrp_rec, _processes_to_restart_without_backup, _processes_to_restart_with_backup,
    filter_autostart_processes, supervisor_process_stop, local_db_path, is_supervisord_running,
    get_node_base_path, is_supervisor_running, separate_pip_install)
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
def upgrade_yarn_mac(c):
    c.run("brew update && brew upgrade yarn")


@task()
def create_venv_python_3(c):
    if not exists(c, '/usr/local/bin/python3'):
        if not exists(c, '/usr/local/bin/brew'):
            c.run('ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"')
        c.run("brew update")
        c.run("brew upgrade")
        c.run("brew install python@2")
        c.run("brew install python")  # This installs python3
        c.run("brew install libmagic")  # needed for python-magic
        c.run('pip2 install virtualenv psycopg2 requests jinja2')
        c.run('python3 -m pip install virtualenv')
    venv3 = os.path.join(os.getcwd(), "venvpy3")
    if exists(c, os.path.join(venv3, "bin/activate")):
        print("Found an already existing virtual env with python 3")
        return
    print("Creating a fresh virtual env with python 3")
    c.run('python3 -m virtualenv --python python3 %s' % venv3)
    c.run('chmod -R o-rwx ' + venv3)


def venv_py3_mac(c):
    project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
    return nested(c.cd(project_prefix), c.prefix('source venv/bin/activate'))


@task()
def update_pip_requirements_mac(c, force_reinstall=False):
    """
    Update external dependencies on local.
    """
    separate_pip_install('pip-tools')
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
def install_elasticsearch(c):
    """Install elasticsearch"""
    ELASTICSEARCH_VERSION = c.config.elasticsearch_version

    base_extract_path = normpath(
        join(c.config.projectpath, 'var'))
    extract_path = join(base_extract_path, 'elasticsearch')
    if exists(c, extract_path):
        print("elasticsearch already installed")
        c.run('rm -rf %s' % extract_path)

    base_filename = 'elasticsearch-{version}'.format(version=ELASTICSEARCH_VERSION)
    tar_filename = base_filename + '.tar.gz'
    sha1_filename = tar_filename + '.sha1'
    with c.cd(base_extract_path):
        if not exists(c, tar_filename):
            c.run('curl -o {fname} https://artifacts.elastic.co/downloads/elasticsearch/{fname}'.format(fname=tar_filename))
        sha1_expected = c.run('curl https://artifacts.elastic.co/downloads/elasticsearch/' + sha1_filename).stdout
        sha1_effective = c.run('openssl sha1 ' + tar_filename).stdout
        if ' ' in sha1_effective:
            sha1_effective = sha1_effective.split(' ')[-1]
        assert sha1_effective == sha1_expected, "sha1sum of elasticsearch tarball doesn't match, exiting"
        c.run('tar zxf ' + tar_filename)
        c.run('rm ' + tar_filename)
        c.run('mv %s elasticsearch' % base_filename)

        # ensure that the folder being scp'ed to belongs to the user/group
        user = c.config._user if '_user' in c.config else getpass.getuser()
        c.run('chown -R {user}:{group} {path}'.format(
            user=user, group=c.config._group,
            path=extract_path))

        # Make elasticsearch and plugin in /bin executable
        c.run('chmod ug+x {es} {esp} {in_sh} {sysd} {log}'.format(
            es=join(extract_path, 'bin/elasticsearch'),
            esp=join(extract_path, 'bin/elasticsearch-plugin'),
            in_sh=join(extract_path, 'bin/elasticsearch.in.sh'),
            sysd=join(extract_path, 'bin/elasticsearch-systemd-pre-exec'),
            log=join(extract_path, 'bin/elasticsearch-translog'),
        ))
        c.run(c.config.projectpath + '/var/elasticsearch/bin/elasticsearch-plugin install https://artifacts.elastic.co/downloads/elasticsearch-plugins/analysis-smartcn/analysis-smartcn-{version}.zip'.format(version=ELASTICSEARCH_VERSION))
        c.run(c.config.projectpath + '/var/elasticsearch/bin/elasticsearch-plugin install https://artifacts.elastic.co/downloads/elasticsearch-plugins/analysis-kuromoji/analysis-kuromoji-{version}.zip'.format(version=ELASTICSEARCH_VERSION))

        print "Successfully installed elasticsearch"


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
    install_java(c)
    install_elasticsearch(c)
    install_database(c)
    install_core_dependencies(c)
    install_assembl_server_deps(c)
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
    set_file_permissions(c)
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
def updateUrlMetaData(c):
    path = join(c.config.projectpath, '..', 'url_metadata')
    if exists(c, path):
        print('Updating url_metadata Git repository')
        with c.cd(path):
            c.run('git pull')
        with venv_py3_mac(c):
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
        # TODO: Implement supervisor_process_stop
        # supervisor_process_stop('dev:gulp')
        # supervisor_process_stop('dev:webpack')
        with venv(c, True):
            c.run("rm -rf venv/lib/node_modules/")
            c.run("rm -f venv/bin/npm")  # remove the symlink first otherwise next command raises OSError: [Errno 17] File exists
            c.run("nodeenv --node=%s --npm=%s --python-virtualenv assembl/static/js" % (n_version, npm_version))
        upgrade_yarn_mac(c)
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
    app_db_update(c)
    app_reload(c)


def app_reload(c):
    """
    Restart all necessary processes after an update
    """
    if is_supervisor_running(c):
        with venv(c):
            c.run("supervisorctl stop dev:")
            c.run("supervisorctl update")
            c.run("supervisorctl restart dev:")


@task()
def app_db_update(c):
    """
    Migrates database using south
    """
    print('Migrating database')
    with venv(c):
        c.run('alembic -c %s upgrade head' % (c.config._internal.ini_file))


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


def generate_new_requirements(c):
    "Generate frozen requirements.txt file (with name taken from environment)."
    target = c.config.frozen_requirements or 'requirements.txt'
    venv(" ".join(("pip-compile --output-file", target, c.config.requirement_inputs)))


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
def set_file_permissions(c):
    """Set file permissions for an isolated platform environment"""
    setup_var_directory(c)
    webgrp = '_www'
    # This should cover most cases.
    if webgrp not in c.run('groups').stdout.split():
        username = c.run("whoami").stdout.replace('\n', '')
        c.run('sudo dseditgroup -o edit -a {user} -t user {webgrp}'.format(
            webgrp=webgrp, user=username))
    with c.cd(c.config.projectpath):
        upload_dir = get_upload_dir(c)
        project_path = c.config.projectpath
        code_path = os.getcwd()
        c.run('chmod -R o-rwx ' + project_path)
        c.run('chmod -R g-rw ' + project_path)
        chgrp_rec(c, project_path, webgrp)
        chgrp_rec(c, upload_dir, webgrp, project_path)

        if not (code_path.startswith(project_path)):
            c.run('chmod -R o-rwx ' + code_path)
            c.run('chmod -R g-rw ' + code_path)
            chgrp_rec(c, code_path, webgrp)
        
        c.run('chgrp {webgrp} . {path}/var {path}/var/run {path}/var/share'.format(webgrp=webgrp, path=project_path))
        c.run('chgrp -R {webgrp} {path}/assembl/static {path}/assembl/static2'.format(webgrp=webgrp, path=code_path))
        c.run('chgrp -R {webgrp} {uploads}'.format(webgrp=webgrp, uploads=upload_dir))
        c.run('chmod -R g+rxs {path}/var/run {path}/var/share'.format(path=project_path))
        c.run('chmod -R g+rxs ' + upload_dir)
        c.run('find {path}/assembl/static -type d -print0 |xargs -0 chmod g+rxs'.format(path=code_path))
        c.run('find {path}/assembl/static -type f -print0 |xargs -0 chmod g+r'.format(path=code_path))
        c.run('find {path}/assembl/static2 -type d -print0 |xargs -0 chmod g+rxs'.format(path=code_path))
        c.run('find {path}/assembl/static2 -type f -print0 |xargs -0 chmod g+r'.format(path=code_path))
        # allow postgres user to use pypsql
        c.run('chmod go+x {path}/assembl/scripts'.format(path=code_path))
        c.run('chmod go+r {path}/assembl/scripts/pypsql.py'.format(path=code_path))


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


delete_foreign_tasks(locals())
