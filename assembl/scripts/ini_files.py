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

    vroot = getenv('VIRTUOSO_ROOT')
    assert vroot, 'Please define the VIRTUOSO_ROOT environment variable'
    assert exists(vroot), "VIRTUOSO_ROOT directory does not exist"
    assert exists(join(vroot, 'bin', 'virtuoso-t')),\
        "VIRTUOSO_ROOT directory does not contain bin/virtuoso-t"
    assert exists('var/db/virtuoso.ini.tmpl'),\
        "Please run this script from the assembl root."
    vroot_var = join(vroot, 'var')
    if not exists(vroot_var):
        vroot_var = '/var'
    vroot_lib = join(vroot, 'lib')
    assert exists(vroot_lib)
    if not exists(join(vroot_lib, 'virtodbcu.so'))\
            and exists(join(vroot_lib, 'odbc', 'virtodbcu.so')):
        vroot_lib = join(vroot_lib, 'odbc')
    vname = 'virtuoso'
    if not exists(join(vroot, 'share', vname)):
        names = listdir(join(vroot, 'share'))
        names = [n for n in names
                 if exists(join(vroot, 'share', n, 'vad'))]
        assert len(names) == 1, "Cannot identify the var directory"
        vname = names[0]
    assert exists(join(vroot_var, 'lib', vname, 'vsp')),\
        "Cannot identify the VSP directory"
    assert exists(join(vroot, 'lib', vname, 'hosting')),\
        "Cannot identify the Virtuoso hosting directory"
    vars = {
        'VIRTUOSO_SERVER_PORT': config.getint('virtuoso', 'http_port'),
        'VIRTUOSO_PORT': config.getint('virtuoso', 'port'),
        'VIRTUOSO_ROOT': vroot,
        'VIRTUOSO_ROOT_VAR': vroot_var,
        'VIRTUOSO_ROOT_LIB': vroot_lib,
        'VIRTUOSO_SUBDIR_NAME': vname,
        'CELERY_BROKER': config.get('app:main', 'celery.broker'),
        'here': dirname(abspath('supervisord.conf')),
        'CONFIG_FILE': config_uri
    }
    for fname in ('var/db/virtuoso.ini', 'odbc.ini', 'supervisord.conf',):
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
