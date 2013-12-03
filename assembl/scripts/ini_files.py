""" INI file generator """

import sys
from os import getenv, listdir, mkdir
from os.path import exists, join, dirname, abspath
from ConfigParser import ConfigParser


def main():
    if len(sys.argv) < 2:
        sys.stderr.write('Usage: %s CONFIG_URI\n'
                         % sys.argv[0])
        sys.exit(1)
    config_uri = sys.argv.pop(1)
    config = ConfigParser()
    config.read(config_uri)

    vars = {
        'CELERY_BROKER': config.get('app:main', 'celery.broker'),
        'here': dirname(abspath('supervisord.conf')),
        'CONFIG_FILE': config_uri
    }
    for fname in ('supervisord.conf',):
        tmpl = open(fname+'.tmpl').read()
        inifile = open(fname, 'w')
        inifile.write(tmpl % vars)
        inifile.close()
    if not exists('var'):
        mkdir('var')
    if not exists('var/log'):
        mkdir('var/log')
    if not exists('var/run'):
        mkdir('var/run')
