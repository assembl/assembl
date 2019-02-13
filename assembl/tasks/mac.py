import os

from .common import (venv, task, exists, delete_foreign_tasks)
from .build import (get_node_base_path, get_new_node_base_path)


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
        c.run('pip3 install virtualenv')
    venv3 = c.virtualenv + 'py3'
    print("Creating a fresh virtual env with python 3")
    if exists(c, os.path.join(venv3, "bin/activate")):
        return
    c.run('python3 -mvirtualenv --python python3 %s' % venv3)


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


delete_foreign_tasks(locals())
