import os
import os.path
import re
from pprint import pprint
from time import sleep
from ConfigParser import RawConfigParser

from .common import setup_ctx, running_locally, exists, venv, task


@task()
def print_config(c):
    pprint(c.config.__dict__)


_known_invoke_sections = {'run', 'runners', 'sudo', 'tasks'}


def val_to_ini(val):
    if val is None:
        return ''
    if isinstance(val, bool):
        return str(val).lower()
    return val


def ensureSection(config, section):
    """Ensure that config has that section"""
    if section.lower() != 'default' and not config.has_section(section):
        config.add_section(section)


def yaml_to_ini(yaml_conf, default_section='app:assembl'):
    """Convert a .rc file to a ConfigParser (.ini-like object)

    Items are assumed to be in app:assembl section,
        unless prefixed by "{section}__" .
    Keys prefixed with an underscore are not passed on.
    Keys prefixed with a star are put in the global (DEFAULT) section.
    Value of '__delete_key__' is eliminated if existing.
    """
    p = RawConfigParser()
    ensureSection(p, default_section)
    for key, val in yaml_conf.iteritems():
        if key.startswith('_'):
            continue
        if isinstance(val, dict):
            if key in _known_invoke_sections:
                continue
            ensureSection(p, key)
            for subk, subv in val.iteritems():
                p.set(key, subk, val_to_ini(subv))
        else:
            if val == '__delete_key__':
                # Allow to remove a variable from rc
                # so we can fall back to underlying ini
                p.remove_option(default_section, key)
            else:
                p.set(default_section, key, val_to_ini(val))
    return p


@task()
def create_venv(c):
    if not exists(c, 'venv'):
        c.run('python2 -mvirtualenv venv')


@task(print_config)
def create_venv_python_3(c):
    if c.mac and not exists('/usr/local/bin/python3'):
        if not exists('/usr/local/bin/brew'):
                c.run('ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"')
        c.run("brew update")
        c.run("brew upgrade")
        c.run("brew install python@2")
        c.run("brew install python")  # This installs python3
        c.run("brew install libmagic")  # needed for python-magic
        c.run('pip3 install virtualenv')

    print("Creating a fresh virtual env with python 3")
    if exists(os.path.join(v.venvpath + 'py3', "bin/activate")):
        return
    c.run('python3 -mvirtualenv --python python3 %s' % venv3)


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
def get_aws_invoke_yaml(c):
    assert running_locally(c)
    import requests
    r = requests.get('http://169.254.169.254/latest/meta-data/iam/info')
    assert r.ok
    account = r.json()['InstanceProfileArn'].split(':')[4]
    # This introduces a convention: yaml files
    # for a given amazon account will be stored in
    # s3://assembl-data-{account_id}/{fname}.yaml
    invoke_path = c.config.projectpath + '/invoke.yaml'
    bucket = 'assembl-data-' + account
    content = get_s3_file(
        bucket,
        'invoke.yaml',
        invoke_path)
    if not content:
        content = '_extends: terraform.yaml\n'
        with open(invoke_path, 'w') as f:
            f.write(content)
    extends_re = re.compile(r'\b_extends:\s*(\w+\.yaml)')
    match = extends_re.search(content)
    while match:
        key = match.group(1)
        ex_content = get_s3_file(bucket, key)
        if not ex_content:
            break
        with open(key, 'w') as f:
            f.write(ex_content)
        match = extends_re.search(ex_content)
    if not content:
        raise RuntimeError("invoke.yaml was not defined in S3" % account)


@task()
def aws_instance_startup(c):
    """Operations to startup a fresh aws instance from an assembl AMI"""
    setup_aws_default_region(c)
    get_aws_invoke_yaml(c)
    if not exists(c, c.config.projectpath + "/invoke.yaml"):
        raise RuntimeError("Missing invoke.yaml file")
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
        result = c.run('supervisorctl pid', echo=True)
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
    if not is_supervisord_running(c):
        return
    with venv(c):
        c.run("supervisorctl shutdown")
    for i in range(10):
        sleep(6)
        with venv(c):
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
        ini_file = c.config.get('_internal', {}).get('ini_file', 'local.ini')
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
    """Compose local.ini from the given .yaml file"""
    from assembl.scripts.ini_files import extract_saml_info, populate_random, find_ini_file, combine_ini
    assert running_locally(c)
    c.config.DEFAULT['code_root'] = c.config.code_root  # Is this used?
    # Special case: uwsgi does not do internal computations.
    if 'uwsgi' not in c.config:
        c.config.uwsgi = {}
    c.config.uwsgi.virtualenv = c.config.projectpath + '/venv'
    ini_sequence = c.config.get('ini_files', None)
    assert ini_sequence, "Define ini_files"
    ini_sequence = ini_sequence.split()
    base = RawConfigParser()
    random_file = c.config.get('random_file', None)
    for overlay in ini_sequence:
        if overlay == 'RC_DATA':
            overlay = yaml_to_ini(c.config)
        elif overlay.startswith('RANDOM'):
            templates = overlay.split(':')[1:]
            overlay = populate_random(
                random_file, templates, extract_saml_info(c.config))
        else:
            overlay = find_ini_file(overlay, os.path.join(c.config.code_root, 'assembl', 'configs'))
            assert overlay, "Cannot find " + overlay
        combine_ini(base, overlay)
    ini_file_name = c.config.get('_internal', {}).get('ini_file', 'local.ini')
    local_ini_path = os.path.join(c.config.projectpath, ini_file_name)
    if exists(c, local_ini_path):
        c.run('cp %s %s.bak' % (local_ini_path, local_ini_path))
    with open(local_ini_path, 'w') as f:
        base.write(f)


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
