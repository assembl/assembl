import sys
from os.path import exists, join

from invoke import task
from common import (
    fill_template,
    is_integration_env,
    delete_foreign_tasks,
    get_venv_site_packages,
    exists as sudo_exists)


core_dependencies = [
    'apt-transport-https',
    'automake',
    'bison',
    'build-essential',
    'curl',
    'flex',
    'gawk',
    'git',
    'gperf',
    'graphviz',
    'libcurl4-openssl-dev',
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
    'pkg-config',
    'python-dev',
    'rsync',
    'wget',
]

python_dependencies = [
    'python-dev',
    'python-pip',
    'build-essential'
]


@task
def install_python(c):
    c.sudo('apt-get install -y {}'.format(' '.join(python_dependencies)))


@task
def install_base_deps(c):
    """Install base tools for a Ubuntu server."""
    assembl_python_essentials = [
        'python-virtualenv',
        'python-psycopg2',
        'python-semantic-version',
        'python-requests',
        'python-jinja2',
        'python-yaml',
        'python-boto3'
    ]
    total_dependencies = set(core_dependencies) + set(python_dependencies) + set(assembl_python_essentials)
    c.sudo('apt-get install -y %s' % ' '.join(list(total_dependencies)))


def install_database_linux(c):
    print('Installing Postgresql')
    c.sudo('apt-get install -y postgresql')
    if exists('/etc/init.d/postgresql'):
        c.sudo('/etc/init.d/postgresql start')
    else:
        print("Make sure that postgres is running")


@task
def install_database(c):
    """
    Install a postgresql DB server
    """
    if sys.platform == 'darwin':
        from .mac import install_database as install_database_mac
        install_database_mac(c)
    else:
        install_database_linux(c)


@task
def install_assembl_systemd(c, assembl_path=None):
    """Push assembl.service configuration on a server. Asseme cloud env only"""
    base = get_venv_site_packages(c)
    template_dir = join(base, 'templates/system/')
    template_path = join(template_dir, 'assembl.service.jinja2')
    assert sudo_exists(c, template_path, sudo=True)
    fill_template(c, template_path, '/tmp/assembl.service', default_dir=template_dir)

    c.sudo('cp /tmp/assembl.service /etc/systemd/system/assembl.service')
    c.sudo('sudo systemctl daemon-reload')
    c.sudo('systemctl enable assembl')
    c.run('rm /tmp/assembl.service')


@task
def install_uwsgicloudwatch_systemd(c, assembl_path=None):
    """Push uwsgicloudwatch.service configuration on a server"""
    base = get_venv_site_packages(c)
    template_dir = join(base, 'templates/system/')
    template_path = join(template_dir, 'uwsgicloudwatch.service.jinja2')
    assert sudo_exists(c, template_path, sudo=True)
    fill_template(c, template_path, '/tmp/uwsgicloudwatch.service', default_dir=template_dir)

    c.sudo('cp /tmp/uwsgicloudwatch.service /etc/systemd/system/uwsgicloudwatch.service')
    c.sudo('sudo systemctl daemon-reload')
    c.sudo('systemctl enable uwsgicloudwatch')
    c.run('rm /tmp/uwsgicloudwatch.service')


@task
def install_urlmetadata_systemd(c):
    """Push urlmetadata.service configuration on a server"""
    base = get_venv_site_packages(c)
    template_dir = join(base, 'templates/system/')
    template_path = join(template_dir, 'urlmetadata.service.jinja2.jinja2')
    assert sudo_exists(c, template_path, sudo=True)
    fill_template(c, template_path, '/tmp/urlmetadata.service', default_dir=template_dir)

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
def clear_aptitude_cache(c):
    c.run('sudo apt-get autoclean -qq && sudo apt-get autoremove -qq && sudo rm -rf /var/lib/apt/lists/*')


@task()
def install_build_dependencies(c):
    """Build the necessary packages in order for CI/CD machines to build an Assembl wheel"""
    c.sudo('apt-get update -qq')
    c.sudo('apt-get install -yqq %s' % ' '.join(core_dependencies))
    c.run('pip install -r requirements-build.txt')


@task()
def install_node_and_yarn(c):
    """Compiles the necessary packages in order for transpilers to build static asset code. It will often
    be used in the CI/CD context.

    This is different than updating node inside of a virtual environment, and nodeenv is not used. However,
    the node version's MUST be matching.
    """
    node_version = c.config.get('node_version', '10.13.0')
    node_major_version = node_version.split('.')[0]
    c.sudo('apt-get update -qq')
    if is_integration_env(c):
        c.sudo('apt-get remove -yqq cmdtest')
    c.run('curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -')
    c.run('echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list')
    c.run('wget -qO- https://deb.nodesource.com/setup_%s.x | sudo bash -' % node_major_version)
    c.sudo('apt-get install -yqq nodejs yarn')


@task()
def install_chrome_dependencies(c):
    """
    Install the requirements for chrome + puppeteer to be run. Assume to be run on Debian based machines
    """
    # assumes apt up-to-date from previously.
    deps = ['gconf-service', 'libasound2', 'libatk1.0-0', 'libc6', 'libcairo2', 'libcups2', 'libdbus-1-3', 'libexpat1',
            'libfontconfig1', 'libgcc1', 'libgconf-2-4', 'libgdk-pixbuf2.0-0', 'libglib2.0-0', 'libgtk-3-0', 'libnspr4',
            'libpango-1.0-0', 'libpangocairo-1.0-0', 'libstdc++6', 'libx11-6', 'libx11-xcb1', 'libxcb1', 'libxcomposite1',
            'libxcursor1', 'libxdamage1', 'libxext6', 'libxfixes3', 'libxi6', 'libxrandr2', 'libxrender1', 'libxss1',
            'libxtst6', 'ca-certificates', 'fonts-liberation', 'libappindicator1', 'libnss3', 'lsb-release', 'xdg-utils',
            'wget']
    c.sudo('apt-get install -yq {}'.format(' '.join(deps)))


@task()
def add_cron_job(c, cmd, force_clean=False, head=False):
    # Will add a cron job to an ubuntu-based cronlist as a sudo user
    if force_clean:
        clause = 'echo %s' % cmd
    else:
        if head:
            clause = '(echo %s; crontab -l)' % cmd
        else:
            clause = '(crontab -l; echo %s)' % cmd
    c.sudo('%s | crontab -' % clause)


delete_foreign_tasks(locals())
