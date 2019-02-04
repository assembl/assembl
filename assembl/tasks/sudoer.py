import os
from os.path import exists, join

from invoke import task
from common import fill_template

# try:
#     # invoke 0.11
#     from invoke import ctask as task
# except ImportError:
#     from invoke import task


@task
def install_base_deps(c):
    """Install base tools for a Ubuntu server."""
    c.sudo('apt-get install -y apt-transport-https')
    c.sudo('apt-get install -y python-virtualenv python-pip python-psycopg2 python-semantic-version')
    c.sudo('apt-get install -y python-requests python-jinja2 python-yaml python-boto3')
    c.sudo('apt-get install -y build-essential python-dev pkg-config')
    c.sudo('apt-get install -y automake bison flex gperf gawk')
    c.sudo('apt-get install -y libpq-dev libmemcached-dev libzmq3-dev '
           'libxslt1-dev libffi-dev libhiredis-dev libxml2-dev libssl-dev '
           'libreadline-dev libxmlsec1-dev libcurl4-openssl-dev')


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


@task()
def webservers_stop(c):
    """Stop all webservers."""
    c.sudo('/etc/init.d/nginx stop')


@task()
def webservers_start(c):
    """Start all webservers."""
    c.sudo("/etc/init.d/nginx start")


@task()
def webservers_reload(c):
    """Reload the webserver stack."""
    result = c.sudo('/usr/sbin/nginx -t')
    if "Command exited with status 0" in str(result):
        c.sudo('/etc/init.d/nginx reload')
    else:
        print ("Can't reload nginx, nginx test configuration not successful.")

    if c.uses_bluenove_actionable:
        restart_bluenove_actionable()
    else:
        stop_bluenove_actionable()


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
    pass


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
