import os
import re

from .common import venv, task


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
        upgrade_yarn()
        with c.cd(get_node_base_path()):
            with venv(c):
                c.run("npm install reinstall -g")

        update_npm_requirement(force_reinstall=True)
    else:
        print "Node version OK"
