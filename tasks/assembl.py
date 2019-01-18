from os.path import exists, isabs
from pprint import pprint

from invoke import task


def rec_update(d1, d2):
    if not isinstance(d1, dict):
        return d2
    result = dict(d1, **d2)
    result.update({k: rec_update(v, d2.get(k, v)) for (k, v) in d1.iteritems() if isinstance(v, dict)})
    return result


@task
def setup_ctx(c):
    """Surgically alter the context's config with config inheritance."""
    project_prefix = getattr(c.config, '_project_home', c.config._project_prefix[:-1])
    assembl_prefix = project_prefix + '/assembl/configs/'
    current = c.config._project
    target = current.get('_extends', None)
    while target:
        if isabs(target):
            if exists(target):
                data = c.config._load_yaml(assembl_prefix + target)
            else:
                raise RuntimeError("Cannot find " + target)
        elif exists(assembl_prefix + target):
            data = c.config._load_yaml(assembl_prefix + target)
        elif exists(project_prefix + target):
            data = c.config._load_yaml(project_prefix + target)
        else:
            raise RuntimeError("Cannot find %s in either %s or %s", (
                target, assembl_prefix, project_prefix))
        target = data.get('_extends', None)
        current = rec_update(data, current)
    if current is not c.config._project:
        c.config._project = current
        c.config.merge()


def venv(c):
    return c.prefix('source venv/bin/activate')


@task(setup_ctx)
def print_config(c):
    pprint(c.config.__dict__)


@task(print_config)
def create_venv(c):
    if not exists('venv'):
        c.run('python2 -mvirtualenv venv')


@task
def create_var_dir(c):
    c.run('mkdir -p var/run var/share var/log var/db')
    c.run('chgrp www-data . var var/run var/share')
    c.run('chmod -R g+rxs var/run var/share')


@task(create_venv)
def install_wheel(c):
    with venv(c):
        c.run('pip install assembl.wheel')


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
