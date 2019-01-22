import os
import os.path
import re
from pprint import pprint
from time import sleep
from contextlib import nested

from invoke import task as base_task

from .common import setup_ctx, running_locally, exists


def venv(c):
    project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
    return nested(c.cd(project_prefix), c.prefix('source venv/bin/activate'))


def task(*args, **kwargs):
    pre = list(kwargs.pop('pre', args))
    pre.append(base_task(setup_ctx))
    return base_task(pre=pre, **kwargs)


@task()
def print_config(c):
    pprint(c.config.__dict__)


@task(print_config)
def create_venv(c):
    if not exists(c, 'venv'):
        c.run('python2 -mvirtualenv venv')


@task()
def create_var_dir(c):
    c.run('mkdir -p var/run var/share var/log var/db')
    c.run('chgrp www-data . var var/run var/share')
    c.run('chmod -R g+rxs var/run var/share')


@task(create_venv)
def install_wheel(c):
    with venv(c):
        # TODO
        c.run('pip install assembl.wheel')


@task()
def setup_aws_default_region(c):
    assert running_locally(c)
    import requests
    r = requests.get('http://169.254.169.254/latest/meta-data/placement/availability-zone')
    assert r.ok
    region = r.content[:-1]
    c.run('aws configure set region ' + region)


def get_s3_file(bucket, key, destination=None):
    import boto3
    s3 = boto3.client('s3')
    try:
        ob = s3.get_object(Bucket=bucket, Key=key)
        content = ob['Body'].read()
        if destination:
            with open(destination, 'w') as f:
                f.write(content)
        return content
    except s3.exceptions.NoSuchKey:
        return None


@task()
def get_aws_localrc(c):
    assert running_locally(c)
    import requests
    r = requests.get('http://169.254.169.254/latest/meta-data/iam/info')
    assert r.ok
    account = r.json()['InstanceProfileArn'].split(':')[4]
    # This introduces a convention: local.rc files
    # for a given amazon account will be stored in
    # s3://bluenove-assembl-configurations/local_{account_id}.rc
    content = get_s3_file(
        'bluenove-assembl-configurations',
        'local_%s.rc' % account,
        c.config.projectpath + '/local.rc')
    extends_re = re.compile(r'\b_extends\s*=\s*(\w+\.rc)')
    match = extends_re.search(content)
    while match:
        key = match.group(1)
        ex_content = get_s3_file('bluenove-assembl-configurations', key)
        if not ex_content:
            break
        with open(key, 'w') as f:
            f.write(ex_content)
        match = extends_re.search(ex_content)
    if not content:
        raise RuntimeError("local_%s.rc was not defined in S3" % account)


@task()
def aws_instance_startup(c):
    """Operations to startup a fresh aws instance from an assembl AMI"""
    setup_aws_default_region(c)
    get_aws_localrc(c)
    if not exists(c, c.config.projectpath + "/local.rc"):
        raise RuntimeError("Missing local.rc file")
    c.config['rcfile'] = "local.rc"
    setup_ctx(c)
    aws_server_startup_from_local(c)


def fill_template(c, template, output=None, default_dir=None):
    if not os.path.exists(template):
        if not default_dir:
            default_dir = os.path.join(c.config.code_root, 'assembl', 'templates', 'system')
        template = os.path.join(default_dir, template)
    if not os.path.exists(template):
        raise RuntimeError("Missing template")
    c.config['here'] = c.config.get('here', os.getcwd())
    if template.endswith('.tmpl'):
        with open(template) as tmpl:
            result = tmpl.read() % c.config
    elif template.endswith('.jinja2'):
        from jinja2 import Environment
        env = Environment()
        with open(template) as tmpl:
            tmpl = env.from_string(tmpl.read())
        # Boolean overloading
        # Jinja should interpret 'false' as False but no:
        # https://github.com/ansible/ansible/issues/14983
        for (k, v) in c.config.items():
            if str(v).lower() == 'false':
                c.config[k] = False
            if '%(' in str(v):
                try:
                    c.config[k] = v % c.config
                except KeyError:
                    pass
        result = tmpl.render(c.config)
    else:
        raise RuntimeError("Unknown template type")
    if hasattr(output, 'write'):
        output.write(result)
    else:
        with open(output, 'w') as out:
            out.write(result)


def is_supervisord_running(c):
    with venv(c):
        result = c.run('supervisorctl pid')
    if 'no such file' in result.stdout:
        return False
    try:
        pid = int(result.stdout)
        if pid:
            return True
    except RuntimeError:
        return False


@task()
def supervisor_shutdown(c):
    """
    Shutdown Assembl's supervisor
    """
    with venv(c):
        if not is_supervisord_running(c):
            return
        c.run("supervisorctl shutdown")
        for i in range(10):
            sleep(6)
            result = c.run("supervisorctl status", warn=True)
            if not result.failed:
                break
    # Another supervisor, upstart, etc may be watching it, give it more time
    sleep(6)


@task()
def supervisor_restart(c):
    """Restart supervisor itself."""
    supervisor_shutdown(c)
    with venv(c):
        result = c.run("supervisorctl status")
        if "no such file" in result.stdout:
            c.run("supervisord")


@task()
def webservers_reload(c):
    """
    Reload the webserver stack.
    """
    # Nginx (sudo is part of command line here because we don't have full
    # sudo access
    print("Reloading nginx")
    if os.path.exists('/etc/init.d/nginx'):
        user = c.config.get('webmaster_user', c.config.get('sudo_user', None))
        c.sudo('/etc/init.d/nginx reload', user=user)
    elif c.config.get(c.config.mac, False):
        c.sudo('killall -HUP nginx')


@task()
def aws_server_startup_from_local(c):
    """Update files that depend on local.rc and restart nginx, supervisor"""
    create_local_ini(c)
    with venv(c):
        ini_file = c.config.get('internal', {}).get('_ini_file', 'local.ini')
        c.run('assembl-ini-files populate %s' % (ini_file))
    fill_template(c, 'assembl/templates/system/nginx_default.jinja2', 'var/share/assembl.nginx')
    if is_supervisord_running(c):
        supervisor_restart()
    else:
        with venv(c):
            c.run('supervisord')
    webservers_reload()


@task()
def create_local_ini(c):
    """Replace the local.ini file with one composed from the current .rc file"""
    if not running_locally(c):
        pass  # TODO: update_vendor_config(c)
    yamlfile = c.config.get('yamlfile', 'invoke.yaml')
    assert os.path.exists(yamlfile)
    # random_ini_path = os.path.join(c.config.projectpath, c.config.random_file)
    ini_file_name = c.config.get('internal', {}).get('_ini_file', 'local.ini')
    local_ini_path = os.path.join(c.config.projectpath, ini_file_name)
    if exists(c, local_ini_path):
        c.run('cp %s %s.bak' % (local_ini_path, local_ini_path))
    if running_locally(c):
        # The easy case: create a local.ini locally.
        with venv(c):
            c.run("python2 -m assembl.scripts.ini_files compose -o %s %s" % (
                ini_file_name, yamlfile))
    else:
        pass  # TODO


@task(install_wheel)
def assembl_dir_permissions(c):
    code_path = 'venv/lib/python-2.7/site-packages'
    c.run('chgrp -R www-data {path}/assembl/static {path}/assembl/static2'.format(path=code_path))
    c.run('find {path}/assembl/static -type d -print0 |xargs -0 chmod g+rxs'.format(path=code_path))
    c.run('find {path}/assembl/static -type f -print0 |xargs -0 chmod g+r'.format(path=code_path))
    c.run('find {path}/assembl/static2 -type d -print0 |xargs -0 chmod g+rxs'.format(path=code_path))
    c.run('find {path}/assembl/static2 -type f -print0 |xargs -0 chmod g+r'.format(path=code_path))
    c.run('chmod go+x {path}/assembl/scripts'.format(path=code_path))
    c.run('chmod go+r {path}/assembl/scripts/pypsql.py'.format(path=code_path))


@task()
def generate_graphql_documentation(c):
    """Generate HTML documentation page based on graphql schema file."""
    with venv(c):
        with c.cd(os.path.join(c.projectpath, 'assembl/static2/')):
            c.run('npm run documentation')


@task()
def updatemaincode(c):
    """Update code and/or switch branch"""
    with c.cd(c.projectpath):
        c.run('git fetch')
        c.run('git checkout %s' % c.gitbranch)
        c.run('git pull %s %s ' % (c.gitrepo, c.gitbranch))
