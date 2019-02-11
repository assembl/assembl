import os
import os.path
import re
from pprint import pprint
import json
from time import sleep
from ConfigParser import RawConfigParser
from getpass import getuser

from .common import (
    setup_ctx, running_locally, exists, venv, task, local_code_root,
    create_venv, fill_template, get_s3_file)


_known_invoke_sections = {'run', 'runners', 'sudo', 'tasks'}


def val_to_ini(val):
    if val is None:
        return ''
    if isinstance(val, bool):
        return str(val).lower()
    if isinstance(val, (dict, list)):
        return json.dumps(val)
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
def print_config(c):
    pprint(c.config.__dict__)


@task()
def create_var_dir(c):
    c.run('mkdir -p var/run var/share var/log var/db')
    c.run('chgrp www-data . var var/run var/share')
    c.run('chmod -R g+rxs var/run var/share')
    c.run('touch var/share/assembl.nginx')


def get_region(c):
    region = c.config.get('aws_region', None)
    if not region:
        region = os.getenv("AWS_DEFAULT_REGION", None)
    if not region:
        import requests
        r = requests.get('http://169.254.169.254/latest/meta-data/placement/availability-zone')
        assert r.ok
        region = r.content[:-1]
    return region


def get_and_set_region(c):
    c.config.aws_region = get_region(c)
    return c.config.aws_region


@task(create_venv)
def install_wheel(c, allow_index=False):
    wheelhouse = os.getenv('ASSEMBL_WHEELHOUSE', c.config.get(
        'wheelhouse', 's3://bluenove-assembl-wheelhouse'))
    # temporary: we will use assembl-([\d\.]*)-py27-none-any.whl
    wheel = os.getenv('ASSEMBL_WHEEL', c.config.get(
        'assembl_wheel', 'assembl-(.*)-py2-none-any\.whl'))
    allow_index = '' if allow_index else '--no-index'

    def as_semantic(match):
        version = match.group(2)
        version = '-alpha.'.join(version.split('.dev'))
        return Version.coerce(version)
    if wheelhouse.startswith('s3://'):
        wheelhouse = wheelhouse[5:]
        with venv(c, True):
            region = get_and_set_region(c)
            assert region
            if '(' in wheel:
                import requests
                from semantic_version import Version
                r = requests.get('http://{wheelhouse}.s3-website-{region}.amazonaws.com/'.format(
                    wheelhouse=wheelhouse, region=region))
                assert r.ok
                exp = '>(' + wheel + ')<'
                matches = list(re.finditer(exp, r.content))
                # assumption: The first * follows semver, more or less.
                matches.sort(reverse=True, key=as_semantic)
                wheel = matches[0].group(1)
            host = '{wheelhouse}.s3-website-{region}.amazonaws.com'.format(
                region=region, wheelhouse=wheelhouse)
            c.run('./venv/bin/pip --trusted-host {host} install {allow_index}'
                  ' --find-links http://{host}/ http://{host}/{wheel}'.format(
                      host=host, wheel=wheel, allow_index=allow_index))
    else:
        with venv(c, True):
            region = c.config.region
            if '(' in wheel:
                wheelre = re.compile('(%s)$' % wheel)
                wheels = [wheelre.match(name) for name in os.listdir(wheelhouse)]
                wheels = filter(None, wheels)
                matches.sort(reverse=True, key=as_semantic)
                wheel = matches[0].group(1)
            c.run('./venv/bin/pip install {allow_index} --find-links {wheelhouse} {wheelhouse}/{wheel}'.format(
                wheel=wheel, wheelhouse=wheelhouse, allow_index=allow_index))


@task()
def setup_aws_default_region(c):
    assert running_locally(c)
    region = get_and_set_region(c)
    assert region
    c.run('aws configure set region ' + region)


CELERY_YAML = """_extends: cicd.yaml
supervisor:
  autostart_celery: true
  autostart_celery_notify_beat: true
  autostart_uwsgi: false
"""


@task()
def get_aws_invoke_yaml(c, celery=False):
    assert running_locally(c)
    account = os.getenv("AWS_ACCOUNT_ID")
    if not account:
        import requests
        r = requests.get('http://169.254.169.254/latest/meta-data/iam/info')
        assert r.ok
        account = r.json()['InstanceProfileArn'].split(':')[4]
    # This introduces a convention: yaml files
    # for a given amazon account will be stored in
    # s3://assembl-data-{account_id}/{fname}.yaml
    bucket = 'assembl-data-' + account
    invoke_path = os.path.join(c.config.projectpath, 'invoke.yaml')
    if celery:
        with open(invoke_path, 'w') as f:
            f.write(CELERY_YAML)
        invoke_path = os.path.join(c.config.projectpath, 'cicd.yaml')
    content = get_s3_file(
        bucket,
        'cicd.yaml',
        invoke_path)
    if not content:
        content = '_extends: terraform.yaml\n'
        with open(invoke_path, 'w') as f:
            f.write(content)
    extends_re = re.compile(r'\b_extends:\s*(\w+\.yaml)')
    match = extends_re.search(content)
    while match:
        key = match.group(1)
        # assuming local bucket; what if from shared region?
        # maybe look for client_id in bucket name, assume shared otherwise???
        ex_content = get_s3_file(bucket, key)
        if not ex_content:
            break
        with open(os.path.join(c.config.projectpath, key), 'w') as f:
            f.write(ex_content)
        match = extends_re.search(ex_content)
    if not content:
        raise RuntimeError("invoke.yaml was not defined in S3" % account)


@task()
def ensure_aws_invoke_yaml(c):
    if not exists(c, 'invoke.yaml'):
        get_aws_invoke_yaml(c)


def is_supervisord_running(c):
    with venv(c, True):
        result = c.run('supervisorctl pid')
    if not result or 'no such file' in result.stdout or 'refused connection' in result.stdout:
        return False
    try:
        pid = int(result.stdout)
        if pid:
            return True
    except ValueError:
        return False


@task()
def supervisor_shutdown(c):
    """
    Shutdown Assembl's supervisor
    """
    if not is_supervisord_running(c):
        return
    with venv(c, True):
        c.run("supervisorctl shutdown")
    for i in range(10):
        sleep(6)
        with venv(c, True):
            result = c.run("supervisorctl status", warn=True)
        if not result.failed:
            break
    # Another supervisor, upstart, etc may be watching it, give it more time
    sleep(6)


@task()
def supervisor_restart(c):
    """Restart supervisor itself."""
    supervisor_shutdown(c)
    with venv(c, True):
        result = c.run("supervisorctl status")
        if "no such file" in result.stdout:
            c.run("supervisord")

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
    """
    Reload the webserver stack.
    """
    # Nginx (sudo is part of command line here because we don't have full
    # sudo access
    print("Reloading nginx")
    if os.path.exists('/etc/init.d/nginx'):
        result = c.sudo('/usr/sbin/nginx -t')
        if "Command exited with status 0" in str(result):
            c.sudo('/etc/init.d/nginx reload')
        else:
            print("Your Nginx configuration returned an error, please check your nginx configuration.")
    elif c.config.get(c.config.mac, False):
        c.sudo('killall -HUP nginx')


@task(ensure_aws_invoke_yaml)
def create_local_ini(c):
    """Compose local.ini from the given .yaml file"""
    from assembl.scripts.ini_files import extract_saml_info, populate_random, find_ini_file, combine_ini
    assert running_locally(c)
    c.config.DEFAULT = c.config.get('DEFAULT', {})
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


@task(ensure_aws_invoke_yaml)
def generate_nginx_conf(c):
    fill_template(c, 'nginx_default.jinja2', 'var/share/assembl.nginx')


@task(create_local_ini)
def generate_supervisor_conf(c):
    with venv(c, True):
        ini_file = c.config.get('_internal', {}).get('ini_file', 'local.ini')
        c.run('assembl-ini-files populate %s' % (ini_file))


@task()
def download_rds_pem(c, reset=False):
    if reset or not exists(c, 'rds-combined-ca-bundle.pem'):
        c.run('wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem')


@task(generate_nginx_conf, generate_supervisor_conf)
def aws_server_startup_from_local(c):
    """Update files that depend on local.rc and restart nginx, supervisor"""
    if is_supervisord_running(c):
        supervisor_restart(c)
    else:
        with venv(c, True):
            c.run('supervisord')
    webservers_reload(c)


@task(setup_aws_default_region, ensure_aws_invoke_yaml, download_rds_pem, post=[aws_server_startup_from_local])
def aws_instance_startup(c):
    """Operations to startup a fresh aws instance from an assembl AMI"""
    if not exists(c, c.config.projectpath + "/invoke.yaml"):
        raise RuntimeError("Missing invoke.yaml file")
    setup_ctx(c)


@task(setup_aws_default_region, ensure_aws_invoke_yaml, download_rds_pem, install_wheel, post=[aws_server_startup_from_local])
def aws_instance_update_and_startup(c):
    """Operations to startup a fresh aws instance from an assembl AMI"""
    if not exists(c, c.config.projectpath + "/invoke.yaml"):
        raise RuntimeError("Missing invoke.yaml file")
    setup_ctx(c)


@task(setup_aws_default_region, post=[aws_server_startup_from_local])
def aws_celery_instance_startup(c):
    """Operations to startup a fresh celery aws instance from an assembl AMI"""
    get_aws_invoke_yaml(c, True)
    if not exists(c, c.config.projectpath + "/invoke.yaml"):
        raise RuntimeError("Missing invoke.yaml file")
    setup_ctx(c)


@task(install_wheel)
def assembl_dir_permissions(c):
    code_path = 'venv/lib/python2.7/site-packages'
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
def install_bluenove_actionable(c):
    """Install the bluenove_actionable app."""
    if not exists(c, "%s/bluenove-actionable/" % c.config.projectpath):
        with c.cd(c.config.projectpath):
            c.run('git clone git@github.com:bluenove/bluenove-actionable.git')

        with c.cd(os.path.join(c.config.projectpath, '..', 'bluenove-actionable')):
            c.run('mkdir -p data && chmod o+rwx data')
            c.run('docker-compose build', warn=True)


def get_robot_machine(c):
    """Returns the configured robot machine"""
    machines = c.get('machines', '')
    if machines:
        robot = machines.split('/')[0]
        robot_data = robot.split(',')
        if len(robot_data) != 3:
            print ("The data of the user machine are wrong! %s" % robot)
            return None

        return {
            'identifier': robot_data[0].strip(),
            'name': robot_data[1].strip(),
            'password': robot_data[2].strip()
        }
    print "No user machine found!"
    return None


@task()
def start_bluenove_actionable(c):
    """Starts Bigdatext algorithm."""
    path = os.path.join(c.projectpath, '..', 'bluenove-actionable')
    robot = get_robot_machine(c)
    if exists(c, path) and robot:
        url_instance = c.public_hostname
        if url_instance == 'localhost':
            ip = c.run("/sbin/ip -o -4 addr list eth0 | awk '{print $4}' | cut -d/ -f1")
            url_instance = 'http://{}:{}'.format(ip, c.public_port)
            with c.cd(path):
                c.run('docker-compose up -d', warn=True, env={'URL_INSTANCE': url_instance, 'ROBOT_IDENTIFIER': robot.get('identifier'), 'ROBOT_PASSWORD': robot.get('password')})


@task()
def stop_bluenove_actionable(c):
    """Stops Bigdatatext algorithm."""
    path = os.path.join(c.projectpath, '..', 'bluenove-actionable')
    if exists(c, path):
        with c.cd(path):
            c.run('docker-compose down', warn=True)


@task()
def restart_bluenove_actionable(c):
    """Restart Bigdatext algorithm."""
    stop_bluenove_actionable(c)
    start_bluenove_actionable(c)


@task()
def update_bluenove_actionable(c):
    """Update bluenove_actionable git repository and rebuilding tha app."""
    path = os.path.join(c.projectpath, '..', 'bluenove-actionable')
    if exists(c, path):
        with c.cd(path):
            c.run('git pull')
            c.run('docker system prune --volumes -f', warn=True)
            c.run('mkdir -p data && chmod o+rwx data')
            c.run('docker-compose build --no-cache', warn=True)
            restart_bluenove_actionable(c)


@task()
def updatemaincode(c):
    """Update code and/or switch branch"""
    with c.cd(c.projectpath):
        c.run('git fetch')
        c.run('git checkout %s' % c.gitbranch)
        c.run('git pull %s %s ' % (c.gitrepo, c.gitbranch))


@task()
def update_url_metadata(c):
    """Update url metadata microservice."""
    path = os.path.join(c.projectpath, '..', 'url_metadata')
    if exists(c, path):
        with c.cd(path):
            c.run('git pull')
        with venv_py3(c):
            c.run('pip install -e ../url_metadata')


@task()
def app_setup(c):
    """Setup the environment so the appliation can run"""
    if not c.config.package_install:
        with venv(c, True):
            c.run('pip install -e ./')
        create_var_dir(c)
        if not exists(c, c.config.ini_file):
            create_local_ini(c)
        with venv(c, True):
            c.run('assembl-ini-files populate %s' % (c.config.ini_file))
        # Missing part: for local environment only
        # To be separated in a separate function.


def code_root(c, alt_env=None):
    alt_env = alt_env or c
    alt_env = dict(alt_env)
    sanitize_hosts(alt_env)
    if running_locally(c):
        return local_code_root
    else:
        if (as_bool(get_prefixed('package_install', alt_env, False))):
            return os.path.join(venv_path(alt_env), 'lib', 'python2.7', 'site-packages')
        else:
            return get_prefixed('projectpath', alt_env, os.getcwd())


def as_bool(b):
    return str(b).lower() in {"1", "true", "yes", "t", "on"}


def get_prefixed(c, key, alt_env=None, default=None):
    alt_env = alt_env or c
    alt_env = dict(alt_env)
    for prefx in ('', '_', '*'):
        val = alt_env.get(prefx + key, None)
        if val:
            return val
    return default


def sanitize_hosts(c, alt_env=None):
    alt_env = alt_env or c
    alt_env = dict(alt_env)
    if not alt_env.get('hosts', None):
        public_hostname = alt_env.get("public_hostname", "localhost")
        alt_env['hosts'] = [public_hostname]
    elif not isinstance(alt_env['hosts'], list):
        alt_env['hosts'] = alt_env['hosts'].split()


def system_db_user(c):
    if c.config._internal.postgres_db_user:
        return c.config._internal.postgres_db_user
    if c.config._internal.mac:
        return getuser()
    return "postgres"


def run_db_command(c, command, user=None, *args, **kwargs):
    # I need help with this.
    pass


@task()
def check_and_create_database_user(c, host=None, user=None, password=None):
    """
    Create a user and a DB for the project.
    """
    host = host or c.config.DEFAULT.db_host
    user = user or c.config.DEFAULT.db_user
    password = password or c.DEFAULT.db_password
    pypsql = os.path.join(code_root(c), 'scripts', 'pypsql.py')
    checkUser = c.run('python2 {pypsql} -1 -u {user} -p {password} -n {host} "{command}"'.format(
        command="SELECT 1 FROM pg_roles WHERE rolname='%s'" % (user),
        pypsql=pypsql, password=password, host=host, user=user))
    if checkUser.failed:
        db_user = system_db_user()
        if (running_locally(c) or c.config.host_string == host) and db_user:
            db_password_string = ''
            sudo_user = db_user
        else:
            db_password = c.config.get('postgres_db_password', None)
            assert db_password is not None, "We need a password for postgres on " + host
            db_password_string = "-p '%s'" % db_password
            sudo_user = None
        run_db_command('python2 {pypsql} -u {db_user} -n {host} {db_password_string} "{command}"'.format(
            command="CREATE USER %s WITH CREATEDB ENCRYPTED PASSWORD '%s'; COMMIT;" % (
                user, password),
            pypsql=pypsql, db_user=db_user, host=host, db_password_string=db_password_string),
            sudo_user)
    else:
        print("User exists and can connect")


@task()
def build_doc(c):
    """Build the Sphinx documentation for the backend (and front-end) as well as build GraphQL documentation"""
    # generate_graphql_documentation(c)
    with c.cd(c.config.projectpath):
        c.run('rm -rf doc/autodoc doc/jsdoc')
        with venv(c):
            c.run('./assembl/static/js/node_modules/.bin/jsdoc -t ./assembl/static/js/node_modules/jsdoc-rst-template/template/ --recurse assembl/static/js/app -d ./doc/jsdoc/')
            c.run('env SPHINX_APIDOC_OPTIONS="members,show-inheritance" sphinx-apidoc -e -f -o doc/autodoc assembl')
            c.run('python2 assembl/scripts/make_er_diagram.py %s -o doc/er_diagram' % (c.ini_files))
            c.run('sphinx-build doc assembl/static/techdocs')


# avoid it being defined in both modules
del create_venv