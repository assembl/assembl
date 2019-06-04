import os

from os.path import join, normpath

from .common import (venv, venv_py3, task, exists, delete_foreign_tasks, get_assembl_code_path)
from .build import (get_node_base_path, get_new_node_base_path)
import getpass
from ConfigParser import ConfigParser, SafeConfigParser


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
def install_core_dependencies(c):
    print 'Installing dependencies, compilers and required libraries'
    c.run('brew install %s' % ' '.join(list(core_dependencies)))
    if not c.run('brew link libevent', quiet=True):
        c.sudo('brew link libevent')


@task()
def uninstall_lamp_mac(c):
    """
    Uninstalls lamp from development environment
    """
    c.run("brew uninstall php56-imagick php56 homebrew/apache/httpd24 mysql")


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
    c.run('chmod -R o-rwx ' + venv3)
    c.run('python3 -m virtualenv --python python3 %s' % venv3)


@task()
def update_npm_requirements_mac(c, force_reinstall=False):
    """Normally not called manually"""
    with c.cd(get_node_base_path(c)):
        if force_reinstall:
            with venv(c):
                c.run('reinstall')
        else:
            with venv(c):
                c.run('npm update')

    yarn_path = '/usr/local/bin/yarn'
    static2_path = get_new_node_base_path(c)
    with c.cd(static2_path):
        if exists(c, yarn_path):
            if force_reinstall:
                print('Removing node_modules directory...')
                with venv(c):
                    c.run('rm -rf {}'.format(os.path.join(static2_path, 'node_modules')))
            with venv(c):
                c.run(yarn_path)
        else:
            if force_reinstall:
                with venv(c):
                    c.run('reinstall')
            else:
                with venv(c):
                    c.run('npm update')

@task()
def install_database(c):
    """
    Install a postgresql DB server
    """
    print('Installing Postgresql')
    c.run('brew install postgresql')
    c.run('brew tap homebrew/services')
    c.run('brew services start postgres')


@task()
def update_pip_requirements_mac(c, force_reinstall=False):
    """
    Update external dependencies on remote host.
    """
    from .build import separate_pip_install
    with venv(c):
        c.run('pip install -U setuptools "pip<10" ', True)

    if force_reinstall:
        with venv(c):
            c.run("pip install --ignore-installed -r %s/requirements.txt" % (c.config.projectpath))
    else:
        specials = [
            # setuptools and lxml need to be installed before compiling dm.xmlsec.binding
            ("lxml", None, None),
            # Thanks to https://github.com/pypa/pip/issues/4453 disable wheel separately.
            ("dm.xmlsec.binding", "%s --install-option='-q'", "%s --install-option='-q'"),
            ("pycurl", None, 'env PYCURL_SSL_LIBRARY=openssl MACOSX_DEPLOYMENT_TARGET="10.13" LDFLAGS="-L/usr/local/opt/openssl/lib" CPPFLAGS="-I/usr/local/opt/openssl/include" %s'),
        ]
        for package, wrapper, mac_wrapper in specials:
            wrapper = mac_wrapper
            separate_pip_install(c, package, wrapper)
        cmd = "pip install -r %s/requirements.txt" % (c.config.projectpath)
        with venv(c):
            c.run("yes w | %s" % cmd)


@task()
def install_java(c):
    """Install openjdk-11-jdk. Require sudo."""
    print('Installing Java')
    c.run('brew cask install java')


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
def install_borg(c):
    print("Installing borg")
    c.run('brew cask install borgbackup')
    ncftp_path = '/usr/local/bin/ncftp'
    if not exists(c, ncftp_path):
        print('Installing ncftp client')
        c.run('brew install ncftp')


@task(install_core_dependencies, upgrade_yarn_mac)
def install_assembl_server_deps(c):
    print('Assembl Server dependencies installed')


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
    install_assembl_server_deps(c)
    create_venv_python_3(c)
    install_services(c)
    install_borg(c)
    print('Assembl Server installed')


@task()
def bootstrap_from_checkout(c, backup=False):
    """
    Creates the virtualenv and install the app from git checkout
    """
    print('Bootstraping')
    updatemaincode(c, backup=backup)
    """build_virtualenv(c)
    app_update_dependencies(c, backup=backup)
    app_setup(c, backup=backup)
    check_and_create_database_user(c)
    app_compile_nodbupdate(c)
    set_file_permissions(c)
    if not backup:
        app_db_install(c)
    else:
        database_restore(c)
    app_reload(c)
    webservers_reload(c)
    if not is_integration_env() and env.wsginame != 'dev.wsgi':
        create_backup_script(c)
        create_alert_disk_space_script(c)"""
    print('Bootstraping finished')


def updatemaincode(c, backup=False):
    """
    Update code and/or switch branch
    """
    if not backup:
        print('Updating Git repository')
        with c.cd(join(c.config.projectpath)):
            c.run('git fetch')
            c.run('git checkout %s' % c.config._internal.gitbranch)
            c.run('git pull %s %s' % (c.config._internal.gitrepo, c.config._internal.gitbranch))

        path = join(c.config.projectpath, '..', 'url_metadata')
        if exists(c, path):
            print('Updating url_metadata Git repository')
            with c.cd(path):
                c.run('git pull')
            with venv_py3(c):
                c.run('python3 -m pip install -e ../url_metadata')


# # Virtualenv
@task
def build_virtualenv(c, with_setuptools=False):
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
    c.run('python2 -mvirtualenv %s %s' % (setup_tools, v))

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


delete_foreign_tasks(locals())
