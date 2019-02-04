import os
import sys
import re
import json
from hashlib import sha256
from os.path import join, normpath

from semantic_version import Version

from .common import (venv, task, exists, is_integration_env, fill_template)

@task()
def uninstall_lamp_mac(c):
    """
    Uninstalls lamp from development environment
    """
    c.run("brew uninstall php56-imagick php56 homebrew/apache/httpd24 mysql")


@task()
def upgrade_yarn_mac(c):
    c.run("brew update && brew upgrade yarn")

@task()
def create_venv_python_3(c):
    if not exists(c, '/usr/local/bin/python3'):
        if not exists(c, '/usr/local/bin/brew'):
            c.run('ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"')
        c.run("brew update")
        c.run("brew upgrade")
        c.run("brew install python@2")
        c.run("brew install python")  # This installs python3
        c.run("brew install libmagic")  # needed for python-magic
        c.run('pip3 install virtualenv')
    venv3 = c.virtualenv + 'py3'
    print("Creating a fresh virtual env with python 3")
    if exists(c, os.path.join(venv3, "bin/activate")):
        return
    c.run('python3 -mvirtualenv --python python3 %s' % venv3)
