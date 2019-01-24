import os
import re
from os.path import join, normpath
from .common import venv, task
from fabric.contrib.files import exists

def get_node_base_path(c):
    return normpath(join(
        c.projectpath, 'assembl', 'static', 'js'))


def get_new_node_base_path(c):
    return normpath(join(
        c.projectpath, 'assembl', 'static2'))


def get_node_modules_path(c):
    return normpath(join(
        get_node_base_path(c), 'node_modules'))


def get_new_node_modules_path():
    return normpath(join(
        get_new_node_base_path(), 'node_modules'))


def update_bower(c):
    with c.cd(get_node_base_path(c)):
        with venv(c):
            c.run('npm update bower po2json')


def get_node_bin_path(c):
    return normpath(join(
        get_node_modules_path(c), '.bin'))


def bower_cmd(c, cmd, relative_path='.'):
    with c.cd(c.projectpath):
        bower_cmd = normpath(join(get_node_bin_path(c), 'bower'))
        po2json_cmd = normpath(join(get_node_bin_path(c), 'po2json'))
        if not exists(bower_cmd) or not exists(po2json_cmd):
            print 'Bower not present, installing ...'
            install_bower()
        with c.cd(relative_path):
            with venv(c):
                c.run(' '.join(("node", bower_cmd, '--allow-root', cmd)))


def _bower_foreach_do(c, cmd):
    bower_cmd(c, cmd)
    bower_cmd(c, cmd, 'assembl/static/widget/card')
    bower_cmd(c, cmd, 'assembl/static/widget/session')
    bower_cmd(c, cmd, 'assembl/static/widget/video')
    bower_cmd(c, cmd, 'assembl/static/widget/vote')
    bower_cmd(c, cmd, 'assembl/static/widget/creativity')
    bower_cmd(c, cmd, 'assembl/static/widget/share')


def separate_pip_install(context, package, wrapper=None):
    cmd = '%s/bin/pip install' % context.config.projectpath+"/venv"
    if wrapper:
        cmd = wrapper % (cmd,)
    context_dict = dict(context)
    cmd = cmd % context_dict
    cmd = "egrep '^%(package)s' %(projectpath)s/requirements-prod.frozen.txt | sed -e 's/#.*//' | xargs %(cmd)s" % dict(cmd=cmd, package=package, **context_dict)
    context.run(cmd)


def upgrade_yarn(context):
    import pdb; pdb.set_trace()
    if context.config._internal.mac:
        context.run('brew update && brew upgrade yarn')
    else:
        context.sudo('apt-get update && apt-get install --only-upgrade yarn')


@task()
def update_bower_requirements(c, force_reinstall=False):
    """ Normally not called manually """
    _bower_foreach_do(c, 'prune')
    if force_reinstall:
        _bower_foreach_do(c, 'install --force')
    else:
        _bower_foreach_do(c, 'update')


@task()
def update_node(c, force_reinstall=False):
    """
    Install node and nom to a know-good version.
    """
    node_version_cmd_regex = re.compile(r'^v10\.13\.0')
    with venv(c):
        node_version_cmd_result = c.run('node --version', echo=True)
    match = node_version_cmd_regex.match(str(node_version_cmd_result))
    if not match or force_reinstall:
        # Stop gulp and webpack because otherwise node may be busy
        # TODO: Implement supervisor_process_stop
        # supervisor_process_stop('dev:gulp')
        # supervisor_process_stop('dev:webpack')
        with venv(c):
            c.run("rm -rf venv/lib/node_modules/")
            c.run("rm -f venv/bin/npm") # remove the symlink first otherwise next command raises OSError: [Errno 17] File exists
            c.run("nodeenv --node=10.13.0 --npm=6.4.1 --python-virtualenv assembl/static/js")
        upgrade_yarn(c)
        with c.cd(get_node_base_path(c)):
            with venv(c):
                c.run("npm install reinstall -g")

        update_npm_requirement(force_reinstall=True)
    else:
        print "Node version OK"


@task()
def update_npm_requirements(c, force_reinstall=False):
    """Normally not called manually"""
    with c.cd(get_node_base_path(c)):
        if force_reinstall:
            with venv(c):
                c.run('reinstall')
        else:
            with venv(c):
                c.run('npm update')

    if c.config._internal.mac:
        yarn_path = '/usr/local/bin/yarn'
    else:
        yarn_path = '/usr/bin/yarn'
    static2_path = get_new_node_base_path(c)
    with c.cd(static2_path):
        if exists(yarn_path):
            if force_reinstall:
                print('Removing node_modules directory...')
                with venv(c):
                    c.run('rm -rf {}'.format(os.path.join(static2_path, 'node_modules')))
            with venv(c):
                c.run(yarn_path)
        else:
            if force_reinstall:
                with venv(c):
                    c.run('reinstall')
            else:
                with venv(c):
                    c.run('npm update')

@task()
def update_pip_requirements(c, force_reinstall=False):
    """
    Update external dependencies on remote host.
    """
    with venv(c):
        c.run('pip install -U setuptools "pip<10" ')

    if force_reinstall:
        c.run("%s/bin/pip install --ignore-installed -r %s/requirements.txt" % (c.config.venvpath, c.config.projectpath))
    else:
        specials = [
            # setuptools and lxml need to be installed before compiling dm.xmlsec.binding
            ("lxml", None, None),
            # Thanks to https://github.com/pypa/pip/issues/4453 disable wheel separately.
            ("dm.xmlsec.binding", "%s --install-option='-q'", "%s --install-option='-q'"),
            ("pycurl", None, 'env PYCURL_SSL_LIBRARY=openssl MACOSX_DEPLOYMENT_TARGET="10.13" LDFLAGS="-L/usr/local/opt/openssl/lib" CPPFLAGS="-I/usr/local/opt/openssl/include" %s'),
        ]
        for package, wrapper, mac_wrapper in specials:
            wrapper = mac_wrapper if c.config._internal.mac else wrapper
            separate_pip_install(c, package, wrapper)
        cmd = "%s/bin/pip install -r %s/requirements.txt" % (c.config.venvpath, c.config.projectpath)
        c.run("yes w | %s" % cmd)


@task()
def app_update_dependencies(c, force_reinstall=False):
    """
    Updates all python and javascript dependencies.  Everything that requires a
    network connection to update.
    """
    update_pip_requirements(c, force_reinstall=force_reinstall)
    update_node(c, force_reinstall=force_reinstall)
    update_bower(c)
    update_bower_requirements(c, force_reinstall=force_reinstall)
    update_npm_requirements(c, force_reinstall=force_reinstall)
