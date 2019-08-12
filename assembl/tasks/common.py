from __future__ import print_function

import sys
import os
import os.path
import re
from os.path import join, normpath
from contextlib import nested
import base64
import json

from invoke import Task, task as base_task
from os.path import dirname, realpath
from time import sleep
from ConfigParser import RawConfigParser

DEFAULT_SECTION = "DEFAULT"
_local_file = __file__
if _local_file.endswith('.pyc'):
    _local_file = _local_file[:-1]
local_code_root = dirname(dirname(realpath(_local_file)))


_known_invoke_sections = {'run', 'runners', 'sudo', 'tasks'}


def task(*args, **kwargs):
    pre = list(kwargs.pop('pre', args))
    pre.append(base_task(setup_ctx))
    return base_task(pre=pre, **kwargs)


def exists(c, path, sudo=False):
    """
    Return True if given path exists on the current remote host. Taken from patchwork.
    """
    cmd = '{}test -e "$(echo {})"'.format('sudo ' if sudo else '', path)
    return c.run(cmd, hide=True, warn=True).ok


def running_locally(c):
    return c.__class__.__module__.startswith('invoke.')


def rec_update(d1, d2):
    if not isinstance(d1, dict):
        return d2
    result = dict(d1, **d2)
    result.update({k: rec_update(v, d2.get(k, v)) for (k, v) in d1.iteritems() if isinstance(v, dict)})
    return result


def get_aws_account_id(c):
    account = os.getenv("AWS_ACCOUNT_ID")
    if account:
        return account
    # Attempt to fail fast on non-EC2 machines
    if sys.platform != 'linux2' or not os.path.exists('/sys/devices/virtual/dmi/id/bios_version'):
        return None
    with open('/sys/devices/virtual/dmi/id/bios_version') as f:
        platform_info = f.read()
        if 'amazon' not in platform_info:
            return None
    import requests
    try:
        r = requests.get('http://169.254.169.254/latest/dynamic/instance-identity/document', timeout=2)
        if r.ok:
            return r.json()['accountId']
    except:
        return None


def get_secrets_from_manager(c, aws_secret_ids, cache=True):
    base = {}
    if aws_secret_ids:
        import boto3
        secret_clients = {}

        def get_secret_client(region=None):
            region = region or c.config.aws_region
            if region not in secret_clients:
                secret_clients[region] = boto3.client('secretsmanager', region_name=region)
            return secret_clients[region]
        if not isinstance(aws_secret_ids, list):
            aws_secret_ids = aws_secret_ids.split()
        for aws_secret_id in aws_secret_ids:
            region = None  # assume current region
            if ':' in aws_secret_id:
                region = aws_secret_id.split(':')[3]
            sm = get_secret_client(region)
            response = sm.get_secret_value(SecretId=aws_secret_id)
            if 'SecretString' in response:
                info = response['SecretString']
            else:
                info = base64.b64decode(response['SecretBinary'])
            info = json.loads(info)
            base.update(info)
        if cache:
            with open("secrets.yaml", "w") as f:
                for key, val in base.items():
                    f.write("%s: %s\n" % (key, val))
    elif cache and os.path.exists("secrets.yaml"):
        os.path.unlink("secrets.yaml")
    return base


def get_cached_secrets(c):
    base = {}
    if exists(c, "secrets.yaml"):
        with open("secrets.yaml") as f:
            for l in f:
                key, val = l.split(":", 1)
                base[key.strip()] = val.strip()
    return base


@task()
def get_secrets(c, aws_secret_ids, cache=True, reset_cache=False):
    if exists(c, "secrets.yaml") and not reset_cache:
        return get_cached_secrets(c)
    return get_secrets_from_manager(c, aws_secret_ids, cache or reset_cache)


def get_venv_site_packages(c):
    # with venv(c):
    #     lib_path = c.run("python -c 'import sysconfig; print sysconfig.get_path(\"stdlib\")'").stdout.strip()
    # Fixed for now
    return os.path.join('venv/lib/python2.7', 'site-packages', 'assembl')


def set_prod_env_link(c, project_prefix):
    if not exists(c, os.path.join(project_prefix, 'assembl')):
        production_path = os.path.join(project_prefix, get_venv_site_packages(c))
        print("Creating symbolic link between %s and %s" % (production_path, project_prefix))
        c.run('ln -s %s %s' % (production_path, project_prefix), warn=True)


def get_assembl_code_path(c):
    project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
    return os.path.join(project_prefix, 'assembl')


def is_cloud_env(c):
    # Attempts to find the key from the configurations. However, due to the recursive nature
    # of configuration files, if it is not yet in the config, makes a calculated guess of cloud vs non-cloud
    # Assumption: In AWS cloud, assembl is installed as a wheel, and it is available under the venv site-packages
    # To bypass the calculation, ensure the *highest* level of invoke.yaml includes the _internal: cloud: true/false.
    _internal = c.config.get('_internal') or {}
    result = _internal.get('cloud', False)
    if not result:
        # Calculated attempt
        cloud_assembl_path = get_venv_site_packages(c)
        if os.path.exists(cloud_assembl_path):
            return True
    return result


def setup_ctx(c):
    """Surgically alter the context's config with config inheritance."""
    project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
    set_prod_env_link(c, project_prefix)
    code_root = get_assembl_code_path(c)
    config_prefix = os.path.join(code_root, 'configs/')
    current = c.config._project or {}
    current['code_root'] = code_root
    current['projectpath'] = project_prefix
    current['_internal'] = c.config.get('_internal') or {}
    current['_internal']['mac'] = sys.platform == 'darwin'
    target = c.config.get('_extends', None)
    if not target and exists(c, 'invoke.yaml'):
        target = 'invoke.yaml'
    while target:
        if os.path.isabs(target):
            if exists(c, target):
                data = c.config._load_yaml(target)
            else:
                raise RuntimeError("Cannot find " + target)
        elif exists(c, config_prefix + target):
            data = c.config._load_yaml(config_prefix + target)
        elif exists(c, os.path.join(project_prefix, target)):
            data = c.config._load_yaml(os.path.join(project_prefix, target))
        else:
            raise RuntimeError("Cannot find %s in either %s or %s", (
                target, config_prefix, project_prefix))
        if not data:
            break
        target = data.get('_extends', None)
        current = rec_update(data, current)

    account_id = current.get('aws_client', None)
    if not account_id:
        account_id = get_aws_account_id(c)
        if account_id:
            current['aws_client'] = account_id
    if account_id:
        aws_secrets_ids = current.get('aws_secrets_ids', None)
        if aws_secrets_ids:
            # partial merge for region
            c.config._project = current
            c.config.merge()
            secrets = get_secrets(c, aws_secrets_ids)
            # client_data can override the secrets
            ks, sks = set(current.keys()), set(secrets.keys())
            for k in ks.intersection(sks):
                secrets.pop(k)
            current.update(secrets)

    if current is not c.config._project:
        c.config._project = current
    c.config.merge()


def venv(c, cd=False):
    venv = c.config.get('virtualenv', None)
    if not venv:
        if exists(c, 'venv'):
            project_prefix = os.getcwd()
            print("Calculated from current dir: %s" % project_prefix)
        else:
            # _project_prefix is defined by Invoke at run-time
            project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
        venv = os.path.join(project_prefix, 'venv')
    print(venv)
    assert exists(c, venv)
    activate = c.config.get('_internal', {}).get('activate', 'activate')
    if cd:
        return nested(c.cd(project_prefix), c.prefix('source %s/bin/%s' % (venv, activate)))
    else:
        return c.prefix('source %s/bin/%s' % (venv, activate))


def venv_py3(c):
    project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
    return nested(c.cd(project_prefix), c.prefix('source venv/bin/activate && ' + 'py3'))


def get_node_base_path(c):
    return os.path.normpath(os.path.join(
        c.config.projectpath, 'assembl', 'static', 'js'))


def is_integration_env(c):
    # Centralize checking whether in CI/CD env
    # Travis (https://docs.travis-ci.com/user/environment-variables/)
    # Gitlab (https://docs.gitlab.com/ee/ci/variables/)
    if os.getenv('CI', None):
        return True
    return False


def fill_template(c, template, output=None, extra=None, default_dir=None):
    """Passing default_dir is often used in cloud conditions. The typical config will assume local env."""
    config = dict(c.config.get('DEFAULT', {}))
    config.update(c.config)
    if extra is not None:
        config.update(extra)
    if not os.path.exists(template):
        if not default_dir:
            default_dir = os.path.join(config['code_root'], 'templates', 'system')
        template = os.path.join(default_dir, template)
    if not os.path.exists(template):
        raise RuntimeError("Missing template")
    config['here'] = config.get('here', os.getcwd())
    if template.endswith('.tmpl'):
        with open(template) as tmpl:
            result = tmpl.read() % config
    elif template.endswith('.jinja2'):
        from jinja2 import Environment
        env = Environment()
        with open(template) as tmpl:
            tmpl = env.from_string(tmpl.read())
        # Boolean overloading
        # Jinja should interpret 'false' as False but no:
        # https://github.com/ansible/ansible/issues/14983
        for (k, v) in config.items():
            if getattr(v, 'update', None):
                # dict or DataProxy
                continue
            if str(v).lower() == 'false':
                config[k] = False
            if '%(' in str(v):
                try:
                    config[k] = v % config
                except KeyError:
                    pass
        result = tmpl.render(config)
    else:
        raise RuntimeError("Unknown template type")
    if hasattr(output, 'write'):
        output.write(result)
    else:
        with open(output, 'w') as out:
            out.write(result)


def get_s3_file(bucket, key, destination=None, region=None):
    import boto3
    s3 = boto3.client('s3', region_name=region)
    try:
        ob = s3.get_object(Bucket=bucket, Key=key)
        content = ob['Body'].read()
        if destination:
            with open(destination, 'w') as f:
                f.write(content)
        return content
    except s3.exceptions.NoSuchKey:
        return None


def s3_file_exists(bucket, key):
    import boto3
    import botocore
    s3 = boto3.resource('s3')
    try:
        s3.Object(bucket, key).load()
        return True
    except botocore.exceptions.ClientError:
        return False


@task()
def create_venv(c, path=None):
    # note that here, we do not depend on setup_ctx
    path = path or os.getcwd()
    if not exists(c, os.path.join(path, 'venv')):
        with c.cd(path):
            c.run('python2 -mvirtualenv venv')


@task()
def configure_github_user(c):
    c.run('git config --global user.email "%s"' % c.config._internal.github.user)
    c.run('git config --global user.name "%s"' % c.config._internal.github.email)

    # update origin from Gitlab to Github
    c.run('git remote rm origin')
    c.run('git remote add origin %s' % c.config._internal.github.repo)


def delete_foreign_tasks(locals):
    here = locals['__name__']
    for (name, func) in locals.items():
        if isinstance(func, Task) and func.__module__ != here and 'tasks.' in func.__module__:
            locals.pop(name)


def setup_var_directory(c):
    c.run('mkdir -p %s' % normpath(join(c.config.projectpath, 'var', 'log')))
    c.run('mkdir -p %s' % normpath(join(c.config.projectpath, 'var', 'run')))
    c.run('mkdir -p %s' % normpath(join(c.config.projectpath, 'var', 'db')))
    c.run('mkdir -p %s' % normpath(join(c.config.projectpath, 'var', 'share')))
    c.run('mkdir -p %s' % get_upload_dir(c))


def get_upload_dir(c, path=None):
    path = path or c.config.get('upload_root', 'var/uploads')
    if path != '/':
        path = join(c.config.projectpath, path)
    return path


def chgrp_rec(c, path, group, upto=None):
    parts = path.split("/")
    success = False
    for i in range(len(parts), 1, -1):
        path = "/".join(parts[:i])
        if path == upto:
            break
        if not c.run('chgrp {group} {path}'.format(group=group, path=path), warn=True).ok:
            break
        if not c.run('chmod g+x {path}'.format(path=path), warn=True).ok:
            break
        success = True
    assert success  # At least the full path


def filter_autostart_processes(c, processes):
    return [p for p in processes
            if c.config.supervisor.get('autostart_' + p, False)]


def get_db_dump_name():
    return 'assembl-backup.pgdump'


def local_db_path(c):
    return join(c.config.projectpath, get_db_dump_name())


def supervisor_process_stop(c, process_name):
    """
    Assuming the supervisord process is running, stop one of its processes
    """
    print('Asking supervisor to stop %s' % process_name)
    supervisor_pid_regex = re.compile(r'^\d+')
    status_regex = re.compile(r'^%s\s*(\S*)' % process_name)
    with venv(c):
        supervisord_cmd_result = c.run("supervisorctl pid", warn=True, hide='out')
    match = supervisor_pid_regex.match(supervisord_cmd_result)
    if not match:
        print('Supervisord doesn\'t seem to be running, nothing to stop')
        return
    for try_num in range(20):
        with venv(c):
            c.run("supervisorctl stop %s" % process_name)
            status_cmd_result = c.run("supervisorctl status %s" % process_name, hide='out')

        match = status_regex.match(status_cmd_result)
        if match:
            status = match.group(1)
            if(status == 'STOPPED'):
                print("%s is stopped" % process_name)
                break
            if(status == 'FATAL'):
                print("%s had a fatal error" % process_name)
                break
            elif(status == 'RUNNING'):
                with venv(c):
                    c.run("supervisorctl stop %s" % process_name)
            elif(status == 'STOPPING'):
                print(status)
            else:
                print("unexpected status: %s" % status)
            sleep(1)
        else:
            print('Unable to parse status (bad regex?)')
            print(status_cmd_result)
            exit()


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


def is_supervisor_running(c):
    with venv(c):
        supervisord_cmd_result = c.run("supervisorctl avail", hide='both', warn=True)
        if supervisord_cmd_result.failed:
            return False
        else:
            return True


def restart_bluenove_actionable(c):
    """
    Restart the bluenove_actionable app. Stop then start the app.
    """
    stop_bluenove_actionable(c)
    start_bluenove_actionable(c)


def stop_bluenove_actionable(c):
    """
    Stop the bluenove_actionable app.
    """
    path = join(c.config.projectpath, '..', 'bluenove-actionable')
    if exists(c, path):
        print('Stop bluenove-actionable')
        with c.cd(path):
            c.run('docker-compose down', warn=True)


def start_bluenove_actionable(c):
    """
    Start the bluenove_actionable app.
    To start the application we need three environment variables:
    - URL_INSTANCE: The URL of the Assembl Instance.
    - ROBOT_IDENTIFIER: The identifier of the Robot user (a machine).
    - ROBOT_PASSWORD: The password of the Robot user.
    If the Robot user is not configured, we can't start the bluenove_actionable app.
    For more information, see the docker-compose.yml file in the bluenove_actionable project.
    """
    path = join(c.config.projectpath, '..', 'bluenove-actionable')
    robot = get_robot_machine()
    if exists(path) and robot:
        print('run bluenove-actionable')
        url_instance = c.config.public_hostname
        if url_instance == 'localhost':
            ip = c.run("/sbin/ip -o -4 addr list eth0 | awk '{print $4}' | cut -d/ -f1")
            url_instance = 'http://{}:{}'.format(ip, c.config.public_port)
        """TODO: fix with shell_env
        with c.cd(path):
            with shell_env(
                URL_INSTANCE=url_instance,
                ROBOT_IDENTIFIER=robot.get('identifier'),
                ROBOT_PASSWORD=robot.get('password')
            ):
                c.run('docker-compose up -d', warn=True)"""


def get_robot_machine(c):
    """
    Return the configured robot machine: (the first configured machine)
    """
    # Retrieve the list of registered machines
    # Machines format: machine_id,machine_name,machine_password/...others
    machines = c.config.get('machines', '')
    if machines:
        # Get the first machine
        robot = machines.split('/')[0]
        # Retrieve the machine data
        robot_data = robot.split(',')
        # We must find three data (identifier, name and password)
        if len(robot_data) != 3:
            print("The data of the user machine are wrong! %s" % robot)
            return None

        return {
            'identifier': robot_data[0].strip(),
            'name': robot_data[1].strip(),
            'password': robot_data[2].strip()
        }

    print("No user machine found!")
    return None


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
    """Convert a .yaml file to a ConfigParser (.ini-like object)

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


def separate_pip_install(c, package, wrapper=None):
    cmd = 'pip install'
    if wrapper:
        cmd = wrapper % (cmd,)
    context_dict = dict(c.config)
    cmd = cmd % context_dict
    cmd = "egrep '^%(package)s' %(projectpath)s/requirements-prod.frozen.txt | sed -e 's/#.*//' | xargs %(cmd)s" % dict(
        cmd=cmd, package=package, **context_dict)
    with venv(c):
        c.run(cmd)
