import sys
import os
import os.path
from contextlib import nested
import base64
import json

from invoke import Task, task as base_task
from os.path import dirname, realpath
DEFAULT_SECTION = "DEFAULT"
_local_file = __file__
if _local_file.endswith('.pyc'):
    _local_file = _local_file[:-1]
local_code_root = dirname(dirname(realpath(_local_file)))


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


def get_secrets(c, aws_secret_ids, cache=True, reset_cache=False):
    if exists(c, "secrets.yaml") and not reset_cache:
        return get_cached_secrets(c)
    return get_secrets_from_manager(c, aws_secret_ids, cache or reset_cache)


def get_venv_site_packages(c):
    # with venv(c):
    #     lib_path = c.run("python -c 'import sysconfig; print sysconfig.get_path(\"stdlib\")'").stdout.strip()
    # Fixed for now
    return os.path.join('venv/lib/python2.7', 'site-packages', 'assembl')


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
    import pdb; pdb.set_trace()
    project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
    if is_cloud_env(c):
        code_root = os.path.join(os.getcwd(), get_venv_site_packages(c))
        config_prefix = code_root + '/configs/'
    else:
        code_root = project_prefix
        config_prefix = code_root + '/assembl/configs/'
    current = c.config._project or {}
    current['code_root'] = code_root
    current['projectpath'] = project_prefix
    current['_internal'] = c.config.get('_internal') or {}
    current['_internal']['mac'] = sys.platform == 'darwin'
    target = c.config.get('_extends', None)
    if not target and exists(c, 'invoke.yaml'):
        target = 'invoke.yaml'
    temp_config = {}
    while target:
        if os.path.isabs(target):
            if exists(c, target):
                data = c.config._load_yaml(config_prefix + target)
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
        temp_config = rec_update(data, temp_config)

    current = rec_update(current, temp_config)

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
            print "Calculated from current dir: %s" % project_prefix
        else:
            # _project_prefix is defined by Invoke at run-time
            project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
        venv = os.path.join(project_prefix, 'venv')
    print venv
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
            default_dir = os.path.join(config['code_root'], 'assembl', 'templates', 'system')
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
    c.run('git remote add origin %s' % c.config._internal.github.repo)


@task()
def add_github_bot_ssh_keys(c, private_key):
    """
    Adds the SSH private key of the bluenove-bot.
    In the CI environment, comes as ENV variable. Can be overriden by passing location of private key as an arg.
    """
    if private_key:
        if exists(private_key):
            c.run("ssh-add %s" % private_key)
        else:
            print("The provided key was not found!")
    else:
        c.run('echo "$GITHUB_BOT_SSH_KEY" | tr -d \'\r\' | ssh-add - > /dev/null')



def delete_foreign_tasks(locals):
    here = locals['__name__']
    for (name, func) in locals.items():
        if isinstance(func, Task) and func.__module__ != here and 'tasks.' in func.__module__:
            locals.pop(name)
