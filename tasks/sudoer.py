from os.path import exists

from invoke import task

# try:
#     # invoke 0.11
#     from invoke import ctask as task
# except ImportError:
#     from invoke import task


@task
def install_base_deps(c):
    """Install base tools for a Ubuntu server."""
    c.sudo('apt-get install -y apt-transport-https')
    c.sudo('apt-get install -y python-virtualenv python-pip python-psycopg2')
    c.sudo('apt-get install -y python-requests python-jinja2 python-yaml python-boto3')
    c.sudo('apt-get install -y build-essential python-dev pkg-config')
    c.sudo('apt-get install -y automake bison flex gperf gawk')
    c.sudo('apt-get install -y libpq-dev libmemcached-dev libzmq3-dev '
           'libxslt1-dev libffi-dev libhiredis-dev libxml2-dev libssl-dev '
           'libreadline-dev libxmlsec1-dev libcurl4-openssl-dev')


@task
def install_nginx(c):
    """Install Nginx on ubuntu."""
    c.sudo('apt-get install -y nginx uwsgi uwsgi-plugin-python')


@task
def install_yarn(c):
    """Install yarn."""
    if not c.run('which yarn', warn=True).failed:
        return
    if not exists('/etc/apt/sources.list.d/yarn.list'):
        c.run('echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee -a /etc/apt/sources.list.d/yarn.list')
        c.run('curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -')
        c.sudo('apt-get update')
    c.sudo('apt-get install -y yarn')


@task
def create_assembl_user(c):
    """Create assembl user (run as sudoer ubuntu)."""
    c.sudo("addgroup assembl_group")
    c.sudo("adduser --disabled-password --gecos '' assembl_user")
    c.sudo("usermod -G www-data -G assembl_group assembl_user")
    c.run("echo '%assembl_group ALL = (root) NOPASSWD: /etc/init.d/nginx restart , /etc/init.d/nginx reload , /etc/init.d/nginx stop , /etc/init.d/nginx start' | sudo tee /etc/sudoers.d/assembl_group")


@task
def create_venv(c):
    c.sudo("-i python2 -mvirtualenv venv")


@task
def assembl_tasks(c):
    c.sudo("-i aws s3 cp s3://bluenove-assembl-configurations/assembl_tasks.py tasks.py", user='assembl_user')
    c.sudo("-i invoke bootstrap_assembl", user='assembl_user')


@task(install_base_deps, install_nginx, install_yarn, create_assembl_user, assembl_tasks)
def bootstrap_assembl(c):
    pass
