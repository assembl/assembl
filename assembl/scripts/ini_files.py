#!/usr/bin/env python
""" Generate various secondary INI files from the main INI file. """

import sys
import os
from os.path import exists, join, dirname, abspath
from ConfigParser import (
    NoSectionError, SafeConfigParser, RawConfigParser as Parser)
from argparse import ArgumentParser, FileType
import logging

from fabfile import combine_rc


log = logging.getLogger('assembl')
logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)

# Case sensitive options
Parser.optionxform = str


SECTION = 'app:assembl'
RANDOM_FILE = 'random.ini'

# The defaults allow to set sensible values and not edit all the local.ini
# files. Err towards conservative production values.
# If something SHOULD be defined, assert its presence later on.
# TODO: Subclass ConfigParser to give a warning whenever a value
# is taken from the defaults.

DEFAULTS = {
    # Define either the first or all others.
    'celery_tasks.broker': '',
    'celery_tasks.imap.broker': '',
    'celery_tasks.notification_dispatch.broker': '',
    'celery_tasks.notify.broker': '',
    'celery_tasks.translate.broker': '',
    # num_workers: These are production values
    'celery_tasks.imap.num_workers': '1',
    'celery_tasks.notification_dispatch.num_workers': '1',
    'celery_tasks.notify.num_workers': '2',
    'celery_tasks.translate.num_workers': '2',
    # Sensible defaults
    'autostart_virtuoso': 'false',
    'autostart_celery_imap': 'false',
    'autostart_celery_notification_dispatch': 'true',
    'autostart_celery_notify': 'true',
    'autostart_celery_notify_beat': 'true',
    'autostart_celery_translate': 'false',
    'autostart_source_reader': 'true',
    'autostart_changes_router': 'true',
    'autostart_pserve': 'false',
    'autostart_nodesass': 'false',
    'autostart_gulp': 'false',
    'autostart_webpack': 'false',
    'autostart_uwsgi': 'false',
    'autostart_metrics_server': 'false',
    'autostart_edgesense_server': 'false',
}


def asParser(fob, cls=Parser):
    """ConfigParser from a .ini filename or open file object. Idempotent."""
    if isinstance(fob, cls):
        return fob
    p = cls()
    if isinstance(fob, (str, unicode)):
        p.read(fob)
    else:
        p.readfp(fob)
    return p


def ensureSection(config, section):
    """Ensure that config has that section"""
    if section.lower() != 'default' and not config.has_section(section):
        config.add_section(section)


def generate_ini_files(config, config_fname):
    """Generate the supervisor.conf from its template and .ini file."""
    # TODO: Use .rc file instead of .ini file.
    using_virtuoso = 'virtuoso' in config.get('app:assembl', 'sqlalchemy.url')
    try:
        metrics_code_dir = config.get('metrics', 'metrics_code_dir')
        metrics_cl = config.get('metrics', 'metrics_cl')
        has_metrics_server = (
            metrics_code_dir and exists(metrics_code_dir) and
            exists(metrics_cl.split()[0]))
    except NoSectionError:
        has_metrics_server = False
        metrics_cl = '/bin/ls'  # innocuous
        metrics_code_dir = ''
    try:
        edgesense_code_dir = config.get('edgesense', 'edgesense_code_dir')
        edgesense_venv = config.get('edgesense', 'venv')
        has_edgesense_server = (
            edgesense_code_dir and exists(edgesense_code_dir) and
            exists(join(
                edgesense_venv, 'bin', 'edgesense_catalyst_server')))
    except NoSectionError:
        has_edgesense_server = False
        edgesense_venv = '/tmp'  # innocuous
        edgesense_code_dir = ''
    default_celery_broker = config.get(
        SECTION, 'celery_tasks.broker')
    imap_celery_broker = config.get(
        SECTION, 'celery_tasks.imap.broker') or default_celery_broker
    notif_dispatch_celery_broker = config.get(
        SECTION, 'celery_tasks.notification_dispatch.broker'
        ) or default_celery_broker
    notify_celery_broker = config.get(
        SECTION, 'celery_tasks.notify.broker') or default_celery_broker
    translate_celery_broker = config.get(
        SECTION, 'celery_tasks.translate.broker') or default_celery_broker
    assert all((imap_celery_broker, notif_dispatch_celery_broker,
                notify_celery_broker, translate_celery_broker)
               ), "Define the celery broker"
    secure = config.getboolean(SECTION, 'require_secure_connection')
    public_hostname = config.get(SECTION, 'public_hostname')
    url = "http%s://%s" % ('s' if secure else '', public_hostname)
    port = config.getint(SECTION, 'public_port')
    # default_port = 443 if secure else 80
    # if port != default_port:
    if port not in (80, 443):
        url += ':' + str(port)
    webpack_port = 8080
    if config.has_option(SECTION, 'webpack_port'):
        webpack_port = config.getint(SECTION, 'webpack_port')
    webpack_url = "http://%s:%d" % (public_hostname, webpack_port)
    vars = {
        'IMAP_CELERY_BROKER': imap_celery_broker,
        'NOTIF_DISPATCH_CELERY_BROKER': notif_dispatch_celery_broker,
        'NOTIFY_CELERY_BROKER': notify_celery_broker,
        'TRANSLATE_CELERY_BROKER': translate_celery_broker,
        'IMAP_CELERY_NUM_WORKERS': config.get(
            SECTION, 'celery_tasks.imap.num_workers'),
        'NOTIF_DISPATCH_CELERY_NUM_WORKERS': config.get(
            SECTION, 'celery_tasks.notification_dispatch.num_workers'),
        'NOTIFY_CELERY_NUM_WORKERS': config.get(
            SECTION, 'celery_tasks.notify.num_workers'),
        'TRANSLATE_CELERY_NUM_WORKERS': config.get(
            SECTION, 'celery_tasks.translate.num_workers'),
        'here': dirname(abspath('supervisord.conf')),
        'CONFIG_FILE': config_fname,
        'autostart_virtuoso': using_virtuoso and config.get(
            'supervisor', 'autostart_virtuoso'),
        'autostart_metrics_server': (config.get(
            'supervisor', 'autostart_metrics_server')
            if has_metrics_server else 'false'),
        'metrics_code_dir': metrics_code_dir,
        'metrics_cl': metrics_cl,
        'autostart_edgesense_server': (config.get(
            'supervisor', 'autostart_edgesense_server')
            if has_edgesense_server else 'false'),
        'edgesense_venv': edgesense_venv,
        'VIRTUAL_ENV': os.environ['VIRTUAL_ENV'],
        'edgesense_code_dir': edgesense_code_dir,
        'WEBPACK_URL': webpack_url,
        'ASSEMBL_URL': url,
    }
    for var in (
            'autostart_celery_imap',
            'autostart_celery_notification_dispatch',
            'autostart_celery_notify',
            'autostart_celery_notify_beat',
            'autostart_celery_translate',
            'autostart_source_reader',
            'autostart_changes_router',
            'autostart_pserve',
            'autostart_nodesass',
            'autostart_gulp',
            'autostart_webpack',
            'autostart_uwsgi'):
        vars[var] = config.get('supervisor', var)
    if using_virtuoso:
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
        vars.update({
            'VIRTUOSO_SERVER_PORT': config.getint('virtuoso', 'http_port'),
            'VIRTUOSO_HOSTNAME': config.get(SECTION, 'public_hostname'),
            'VIRTUOSO_PORT': config.getint('virtuoso', 'port'),
            'VIRTUOSO_ROOT': vroot,
            'VIRTUOSO_ROOT_VAR': vroot_var,
            'VIRTUOSO_ROOT_LIB': vroot_lib,
            'VIRTUOSO_SUBDIR_NAME': vname,
        })
    else:
        # dummy values
        vars.update({
            'VIRTUOSO_SERVER_PORT': 8890,
            'VIRTUOSO_HOSTNAME': 'localhost',
            'VIRTUOSO_PORT': 1111,
            'VIRTUOSO_ROOT': '/usr',
            'VIRTUOSO_ROOT_VAR': '/usr/var',
            'VIRTUOSO_ROOT_LIB': '/usr/var/lib',
            'VIRTUOSO_SUBDIR_NAME': '/usr/share/virtuoso/vad',
        })

    for fname in ('var/db/virtuoso.ini', 'odbc.ini', 'supervisord.conf',):
        print fname
        with open(fname + '.tmpl') as tmpl, open(fname, 'w') as inifile:
            inifile.write(tmpl.read() % vars)


def combine_ini(config, overlay, adding=True):
    """Overlay values of the second ini file on the first.

    Returns a ConfigParser object
    If adding is false, only existing values will be replaced.
    """
    config = asParser(config)
    overlay = asParser(overlay)
    for section in overlay.sections():
        # Avoid including DEFAULTSECT
        for key in overlay._sections[section]:
            value = overlay.get(section, key)
            if adding or config.has_option(section, key):
                ensureSection(config, section)
                config.set(section, key, value)
    if overlay._defaults:
        config._defaults.update(overlay._defaults)
    return config


def dump(ini_file):
    """Dump the ini file, showing interpolations and errors."""
    ini_file = asParser(ini_file, SafeConfigParser)
    ini_file._defaults['here'] = os.getcwd()
    for section in ini_file.sections():
        print "\n[%s]\n" % section
        for option in ini_file._sections[section]:
            print option, '=',
            try:
                print ini_file.get(section, option)
            except Exception as e:
                print ini_file.get(section, option, True)
                print "*"*15, "Could not interpolate"
                print e


def populate_random(saml_info):
    """Populate random.ini

    Create missing random values according to random.tmpl.ini
    Do not change existing ones"""
    from base64 import b64encode
    from os import urandom
    base = Parser()
    base.read(RANDOM_FILE + ".tmpl")
    existing = Parser()
    if exists(RANDOM_FILE):
        existing.read(RANDOM_FILE)
    combine_ini(base, existing)
    saml = None
    changed = False
    for section in base.sections():
        for key, value in base.items(section):
            if value.startswith('{random') and value.endswith("}"):
                value = b64encode(urandom(int(value[7:-1])))
                base.set(section, key, value)
                changed = True
            elif value.startswith('{saml'):
                if saml is None:
                    from assembl.auth.make_saml import make_saml_key
                    saml = make_saml_key(**saml_info)
                if value == '{saml_key}':
                    value = saml[0]
                elif value == '{saml_cert}':
                    value = saml[1]
                else:
                    assert False, "wrong saml code: " + value
                base.set(section, key, value)
                changed = True
    if changed:
        with open(RANDOM_FILE, 'w') as f:
            base.write(f)
    return base


def rc_to_ini(rc_info, default_section=SECTION):
    """Convert a .rc file to a ConfigParser (.ini-like object)

    Items are assumed to be in app:assembl section,
        unless prefixed by "{section}__" .
    Keys prefixed with an underscore are not passed on.
    Keys prefixed with a star are put in the global (DEFAULT) section.
    Value of '__' is eliminated if existing.
    """
    p = Parser()
    for key, val in rc_info.iteritems():
        if not key or key.startswith('_'):
            continue
        if key[0] == '*':
            # Global keys
            section = "DEFAULT"
            key = key[1:]
        elif '__' in key:
            section, key = key.split('__', 1)
        else:
            section = default_section
        ensureSection(p, section)
        if val == '__':
            # Allow to remove a variable from rc
            # so we can access underlying ini
            p.remove_option(section, key)
        else:
            p.set(section, key, val)
    return p


def iniconfig_to_rc(parser, dest=None, extends=None):
    """Convert a ConfigParser to a .rc file.

    That file is written to dest, or to a returned file-like object
    extends specifies an extended ini file."""
    from cStringIO import StringIO
    if dest is None:
        dest = StringIO()
    if extends:
        dest.write("_extends = %s\n" % (extends,))
    for section in parser.sections():
        if section == SECTION:
            prefix = ''
        else:
            prefix = section + '__'
        for key, value in parser.items(section):
            if '\n' in value:
                log.warning("avoid multiline values in RC: %s=%s", key, value)
                value = ' '.join(value.split('\n'))
            dest.write("%s%s = %s\n" % (prefix, key, value))
    if hasattr(dest, 'seek'):
        dest.seek(0)
    return dest


def extract_saml_info(rc_info):
    """Extract SAML variables from the state"""
    saml_info = {k[5:]: v for (k, v) in rc_info.iteritems()
                 if k.startswith('saml_')}
    saml_info['cn'] = rc_info['public_hostname']
    return saml_info


def diff_ini(first, second, diff=None):
    """Diff ini files

    Generate a parser with any value in the second that is different in the first.
    Returns a ConfigParser.
    Takes interpolation into account. Does not include values that disappeared."""
    from ConfigParser import _Chainmap
    first = asParser(first)
    second = asParser(second)
    # TODO: Look at first both in raw and formatted versions
    diff = diff or Parser()
    interpolating = SafeConfigParser()
    for section in second.sections():
        if section != 'DEFAULT' and not first.has_section(section):
            diff.add_section(section)
            for option in second.options(section):
                value = second.get(section, option)
                diff.set(section, option, value)
            continue
        else:
            vars = _Chainmap(second._sections[section], first._sections[section])
            for option, value2 in second.items(section):
                if not first.has_option(section, option):
                    ensureSection(diff, section)
                    diff.set(section, option, value2)
                    continue
                value1 = first.get(section, option)
                if value1 != value2 and '%(' in value1:
                    # try to interpolate, and see if it would amount to the same.
                    try:
                        value1 = interpolating._interpolate(section, option, value1, vars)
                    except:
                        pass
                if value1 != value2:
                    ensureSection(diff, section)
                    diff.set(section, option, value2)
    return diff


def compose(rc_filename):
    """Compose local.ini from the given .rc file"""
    rc_info = combine_rc(rc_filename)
    ini_sequence = rc_info.get('ini_files', None)
    assert ini_sequence, "Define ini_files"
    ini_sequence = ini_sequence.split()
    base = Parser()
    for overlay in ini_sequence:
        if overlay == 'RC_DATA':
            overlay = rc_to_ini(rc_info)
        elif overlay == 'RANDOM':
            overlay = populate_random(extract_saml_info(rc_info))
        combine_ini(base, overlay)
    return base


def migrate(rc_filename, expected_ini):
    """Create a overlay.rc file from the local.ini and a base .rc file"""
    expected_ini = asParser(expected_ini)
    rc_data = combine_rc(rc_filename)
    random_data = populate_random(extract_saml_info(rc_data))
    random_data = combine_ini(random_data, expected_ini, False)
    with open(RANDOM_FILE, 'w') as f:
        random_data.write(f)
    base = compose(rc_filename)
    diff = diff_ini(base, expected_ini)
    return iniconfig_to_rc(diff, extends=rc_filename)


def main():
    parser = ArgumentParser(prog='ini_files.py')
    subparsers = parser.add_subparsers(dest='command', title="subcommands")

    def short_help(fn):
        return fn.__doc__.split('\n')[0]

    # ini populate
    parser_populate = subparsers.add_parser(
        'populate', help=short_help(generate_ini_files))
    parser_populate.add_argument(
        'config',
        help='The source ini file')

    # ini combine
    parser_combine = subparsers.add_parser(
        'combine', help=short_help(combine_ini))
    parser_combine.add_argument('--output', '-o', type=FileType('w'),
                                default=sys.stdout,
                                help='The output file')
    parser_combine.add_argument('input', type=FileType('r'), nargs='+',
                                help='Input ini files')

    # ini compose
    parser_compose = subparsers.add_parser('compose', help=short_help(compose))
    parser_compose.add_argument('--output', '-o', type=FileType('w'),
                                default=sys.stdout, help='The output file')
    parser_compose.add_argument('input', help='Input rc file')

    # ini migrate
    parser_migrate = subparsers.add_parser(
        'migrate', help=short_help(migrate))
    parser_migrate.add_argument('--output', '-o', type=FileType('w'),
                                default=sys.stdout, help='The output file')
    parser_migrate.add_argument(
        '--ini', '-i', type=FileType('r'), default=None,
        help="INI file we're migrating, usually local.ini")
    parser_migrate.add_argument('rc', help='Base rc file')

    # random.ini
    parser_random = subparsers.add_parser(
        'random', help=short_help(populate_random))
    parser_random.add_argument('input', help='Input rc file (for saml)')

    # dump .ini
    parser_dump = subparsers.add_parser(
        'dump', help=short_help(dump))
    parser_dump.add_argument('ini', help='Input ini file')

    # ini diff
    parser_diff = subparsers.add_parser('diff', help=short_help(diff_ini))
    parser_diff.add_argument('--output', '-o', type=FileType('w'),
                             default=sys.stdout, help='The output file')
    parser_diff.add_argument('base', type=FileType('r'),
                             help='Base ini file')
    parser_diff.add_argument('second', type=FileType('r'),
                             help='Second ini file')

    args = parser.parse_args()
    if args.command == 'populate':
        config = SafeConfigParser(defaults=DEFAULTS)
        config.read(args.config)
        generate_ini_files(config, args.config)
    elif args.command == 'combine':
        base = asParser(args.input[0])
        for overlay in args.input[1:]:
            combine_ini(base, overlay)
        base.write(args.output)
    elif args.command == 'random':
        rc_info = combine_rc(args.input)
        populate_random(extract_saml_info(rc_info))
    elif args.command == 'compose':
        ini_info = compose(args.input)
        ini_info.write(args.output)
    elif args.command == 'migrate':
        ini_file = args.ini
        if ini_file is None:
            ini_file = asParser('local.ini')
        else:
            ini_file = asParser(ini_file)
        rc_file = migrate(args.rc, ini_file)
        args.output.write(rc_file.getvalue())
    elif args.command == 'diff':
        diff = diff_ini(args.base, args.second)
        diff.write(args.output)
    if args.command == 'dump':
        dump(args.ini)


if __name__ == '__main__':
    main()
