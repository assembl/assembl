import os
import os.path
from contextlib import nested
import base64
import json

from invoke import task as base_task
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


def exists(c, path):
    """
    Return True if given path exists on the current remote host. Taken from patchwork.
    """
    cmd = 'test -e "$(echo {})"'.format(path)
    return c.run(cmd, hide=True, warn=True).ok


def running_locally(c):
    return c.__class__.__module__.startswith('invoke.')


def rec_update(d1, d2):
    if not isinstance(d1, dict):
        return d2
    result = dict(d1, **d2)
    result.update({k: rec_update(v, d2.get(k, v)) for (k, v) in d1.iteritems() if isinstance(v, dict)})
    return result


def get_secrets_from_manager(c, aws_secret_ids, cache=True):
    base = {}
    if aws_secret_ids:
        import boto3
        sm = boto3.client('secretsmanager')
        if not isinstance(aws_secret_ids, list):
            aws_secret_ids = aws_secret_ids.split()
        for aws_secret_id in aws_secret_ids:
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


def setup_ctx(c):
    """Surgically alter the context's config with config inheritance."""
    project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
    code_root = project_prefix
    config_prefix = code_root + '/assembl/configs/'
    if not exists(c, config_prefix):
        code_root = project_prefix + '/venv/lib/python2.7/site-packages'
        config_prefix = code_root + '/assembl/configs/'

    current = c.config._project or {}
    current['code_root'] = code_root
    current['projectpath'] = project_prefix
    target = current.get('_extends', None)
    if not target and exists(c, 'invoke.yaml'):
        target = 'invoke.yaml'
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
        current = rec_update(data, current)

    aws_secrets_ids = current.get('aws_secrets_ids', None)
    if aws_secrets_ids:
        secrets = get_secrets(c, aws_secrets_ids)
        current.update(secrets)

    if current is not c.config._project:
        c.config._project = current
    c.config.merge()


def venv(c):
    venv = c.config.get('virtualenv', None)
    if not venv:
        if exists(c, 'venv'):
            project_prefix = os.getcwd()
        else:
            # _project_prefix is defined by Invoke at run-time
            project_prefix = c.config.get('_project_home', c.config._project_prefix[:-1])
        venv = os.path.join(project_prefix, 'venv')
    assert exists(c, venv)
    activate = c.config.get('_internal', {}).get('activate', 'activate')
    return nested(c.cd(project_prefix), c.prefix('source %s/bin/%s' % (venv, activate)))


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
    if c.get('CI', None):
        return True
    return False


def fill_template(c, template, output=None, extra=None, default_dir=None):
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
