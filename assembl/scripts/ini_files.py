""" INI file generator """

import sys
from platform import system
from os import listdir, mkdir
from os.path import exists, join, dirname, abspath
from ConfigParser import ConfigParser, NoSectionError


SECTION = 'app:assembl'


def _as_bool_string(val):
    return str(bool(val)).lower()

def main():
    if len(sys.argv) < 2:
        sys.stderr.write('Usage: %s CONFIG_URI\n'
                         % sys.argv[0])
        sys.exit(1)
    config_uri = sys.argv.pop(1)
    config = ConfigParser()
    config.read(config_uri)

    vroot = config.get('virtuoso', 'virtuoso_root')
    if vroot == 'system':
        # Magic value
        if system().startswith('Darwin'):
            vroot = '/usr/local/virtuoso-opensource'
        else:
            vroot = '/usr'
    elif not vroot[0] == '/':
        # Relative path
        vroot = join(dirname(dirname(dirname(__file__))), vroot)
    assert exists(vroot), "virtuoso_root directory does not exist"
    assert exists(join(vroot, 'bin', 'virtuoso-t')),\
        "virtuoso_root directory does not contain bin/virtuoso-t"
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
        assert len(names) == 1, "Cannot identify the vad directory"
        vname = names[0]
    assert exists(join(vroot_var, 'lib', vname, 'vsp')),\
        "Cannot identify the VSP directory"
    try:
        metrics_code_dir = config.get('metrics', 'metrics_code_dir')
        metrics_cl = config.get('metrics', 'metrics_cl')
        has_metrics_server = (
            metrics_code_dir and exists(metrics_code_dir)
            and exists(metrics_cl))
    except NoSectionError:
        has_metrics_server = False
        metrics_cl = '/bin/ls'  # innocuous
        metrics_code_dir = ''
    try:
        edgesense_code_dir = config.get('edgesense', 'edgesense_code_dir')
        edgesense_venv = config.get('edgesense', 'venv')
        has_edgesense_server = (
            edgesense_code_dir and exists(edgesense_code_dir)
            and exists(join(
                edgesense_venv, 'bin', 'edgesense_catalyst_server')))
    except NoSectionError:
        has_edgesense_server = False
        edgesense_venv = '/tmp'  # innocuous
        edgesense_code_dir = ''
    vars = {
        'VIRTUOSO_SERVER_PORT': config.getint('virtuoso', 'http_port'),
        'VIRTUOSO_HOSTNAME': config.get(SECTION, 'public_hostname'),
        'VIRTUOSO_PORT': config.getint('virtuoso', 'port'),
        'VIRTUOSO_ROOT': vroot,
        'VIRTUOSO_ROOT_VAR': vroot_var,
        'VIRTUOSO_ROOT_LIB': vroot_lib,
        'VIRTUOSO_SUBDIR_NAME': vname,
        'IMAP_CELERY_BROKER': config.get(
            SECTION, 'celery_tasks.imap.broker'),
        'NOTIF_DISPATCH_CELERY_BROKER': config.get(
            SECTION, 'celery_tasks.notification_dispatch.broker'),
        'NOTIFY_CELERY_BROKER': config.get(
            SECTION, 'celery_tasks.notify.broker'),
        'here': dirname(abspath('supervisord.conf')),
        'CONFIG_FILE': config_uri,
        'autostart_virtuoso': config.get('supervisor', 'autostart_virtuoso'),
        'autostart_celery_imap': config.get(
            'supervisor', 'autostart_celery_imap'),
        'autostart_celery_notification_dispatch': config.get(
            'supervisor', 'autostart_celery_notification_dispatch'),
        'autostart_celery_notify': config.get(
            'supervisor', 'autostart_celery_notify'),
        'autostart_celery_notify_beat': config.get(
            'supervisor', 'autostart_celery_notify_beat'),
        'autostart_source_reader': config.get(
            'supervisor', 'autostart_source_reader'),
        'autostart_changes_router': config.get(
            'supervisor', 'autostart_changes_router'),
        'autostart_pserve': config.get('supervisor', 'autostart_pserve'),
        'autostart_compass': config.get('supervisor', 'autostart_compass'),
        'autostart_gulp': config.get('supervisor', 'autostart_gulp'),
        'autostart_uwsgi': config.get('supervisor', 'autostart_uwsgi'),
        'autostart_metrics_server': (config.get(
            'supervisor', 'autostart_metrics_server')
            if has_metrics_server else 'false'),
        'metrics_code_dir': metrics_code_dir,
        'metrics_cl': metrics_cl,
        'autostart_edgesense_server': (config.get(
            'supervisor', 'autostart_edgesense_server')
            if has_edgesense_server else 'false'),
        'edgesense_venv': edgesense_venv,
        'edgesense_code_dir': edgesense_code_dir,
    }
    print vars
    for fname in ('var/db/virtuoso.ini', 'odbc.ini', 'supervisord.conf',):
        print fname
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

if __name__ == '__main__':
    main()
