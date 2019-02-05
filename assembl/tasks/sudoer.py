import os
from os.path import exists, join

from invoke import task
from common import fill_template, is_integration_env

# try:
#     # invoke 0.11
#     from invoke import ctask as task
# except ImportError:
#     from invoke import task

core_dependencies = [
    'apt-transport-https',
    'automake',
    'bison',
    'build-essential',
    'flex',
    'gawk',
    'rsync',
    'gperf',
    'graphviz',
    'libffi-dev',
    'libgraphviz-dev',
    'libhiredis-dev',
    'libmemcached-dev',
    'libpq-dev',
    'libreadline-dev',
    'libssl-dev',
    'libxml2-dev',
    'libxmlsec1-dev',
    'libxslt1-dev',
    'libzmq3-dev',
    'libcurl4-openssl-dev',
    'pkg-config',
    'python-dev'
]


node_version = {
    'node': '10.13.0',
    'node_re': r'v10\.13\.0',
    'npm': '6.4.1',
}


@task
def install_base_deps(c):
    """Install base tools for a Ubuntu server."""
    python_essentials = [
        'python-virtualenv',
        'python-pip',
        'python-psycopg2',
        'python-semantic-version',
        'python-requests',
        'python-jinja2',
        'python-yaml',
        'python-boto3'
    ]
    total_dependencies = core_dependencies + python_essentials
    c.sudo('apt-get install -y %s' % ','.join(total_dependencies))


@task
def install_assembl_systemd(c):
    base = os.getcwd()
    path = 'assembl/templates/system/assembl.service.jinja2'
    if not exists(path):
        base = '/home/assembl_user/assembl/venv/lib/python2.7/site-packages'
    assert exists(join(base, path))
    c.config.code_root = base
    fill_template(c, join(base, path), '/tmp/assembl.service')

    c.sudo('cp /tmp/assembl.service /etc/systemd/system/assembl.service')
    c.sudo('sudo systemctl daemon-reload')
    c.sudo('systemctl enable assembl')
    c.run('rm /tmp/assembl.service')


@task
def install_urlmetadata_systemd(c):
    base = os.getcwd()
    path = 'assembl/templates/system/urlmetadata.service.jinja2'
    if not exists(path):
        base = '/home/assembl_user/assembl/venv/lib/python2.7/site-packages'
    assert exists(join(base, path))
    c.config.code_root = base
    fill_template(c, join(base, path), '/tmp/urlmetadata.service')

    c.sudo('cp /tmp/urlmetadata.service /etc/systemd/system/urlmetadata.service')
    c.sudo('sudo systemctl daemon-reload')
    c.sudo('systemctl enable urlmetadata')
    c.run('rm /tmp/urlmetadata.service')


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


def upgrade_yarn(c):
    c.sudo('apt-get update && apt-get install --only-upgrade yarn')


@task
def create_assembl_user(c):
    """Create assembl user (run as sudoer ubuntu)."""
    c.sudo("addgroup assembl_group")
    c.sudo("adduser --disabled-password --gecos '' assembl_user")
    c.sudo("usermod -G www-data,assembl_group assembl_user")
    c.run("echo '%assembl_group ALL = (root) NOPASSWD: /etc/init.d/nginx restart , /etc/init.d/nginx reload , /etc/init.d/nginx stop , /etc/init.d/nginx start' | sudo tee /etc/sudoers.d/assembl_group")


@task
def assembl_tasks(c):
    c.sudo("-i aws s3 cp s3://bluenove-assembl-configurations/assembl_tasks.py tasks.py", user='assembl_user')
    c.sudo("-i invoke bootstrap_assembl", user='assembl_user')


@task(install_base_deps, install_nginx, install_yarn, create_assembl_user, assembl_tasks)
def bootstrap_assembl(c):
    pass


def add_user_to_group(c, user, group):
    """Adds designated user to designated group."""
    c.sudo("usermod -a -G %s %s" % (group, user))


@task()
def install_docker(c):
    """Installs docker"""
    c.sudo('apt-get update')
    c.sudo('apt-get install apt-transport-https ca-certificates curl software-properties-common')
    c.sudo('curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -')
    c.sudo('add-apt-repository -y "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"')
    c.sudo('apt-get update; apt-get install -y docker-ce')
    gitpath = 'https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m)'
    c.run('curl -L %s -o /usr/local/bin/docker-compose' % gitpath)
    c.sudo('chmod +x /usr/local/bin/docker-compose')
    add_user_to_group(c.context.user, 'docker')


@task()
def install_fail2ban(c):
    """Install fail2ban"""
    c.sudo('apt-get install -y fail2ban')


@task()
def install_jq(c):
    """Install jq package. jq is like sed for json data."""
    c.sudo('apt-get install -y jq')


@task()
def install_mysql(c):
    """Installs mysql on a linux server."""
    c.run("apt-get -y install mysql-server")


@task()
def install_apache(c):
    """Installs apache on a linux server."""
    c.sudo("apt-get install apache2")


@task()
def install_php(c):
    """Installs php on a linux server."""
    c.sudo("apt-get -y install php php-mysql php-curl php-cli php-gd")


@task()
def uninstall_lamp(c):
    """
    Installs Apache2, Mysql and PHP on a Linux Environment, for dev purposes
    """
    c.sudo("apt-get purge apache2 mysql-server php-mysql php-curl php-cli php-gd")
    c.sudo("apt-get autoremove")


@task()
def set_fail2ban_configurations(c):
    """Set fail2ban configuration and pushes fail2ban configs."""


@task()
def install_build_dependencies(c):
    """Build the necessary packages in order for CI/CD machines to build an Assembl wheel"""
    c.sudo('apt-get update -qq')
    c.sudo('apt-get install -yqq %s' % ','.join(core_dependencies))
    c.run('pip install -r requirements-build.txt')


@task()
def install_node_and_yarn(c):
    """Compiles the necessary packages in order for transpilers to build static asset code. It will often
    be used in the CI/CD context.

    This is different than updating node inside of a virtual environment, and nodeenv is not used. However,
    the node version's MUST be mactching.
    """

    node_major_version = node_version.node.split('.')[0]
    c.sudo('apt-get update -qq')
    if is_integration_env():
        c.sudo('apt-get remove -yqq cmdtest')
    c.sudo('curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -')
    c.sudo('echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list')
    c.sudo('wget -qO- https://deb.nodesource.com/setup_%s.x | bash -' % node_major_version)
    c.sudo('apt-get install -yqq nodejs yarn')
