#!/usr/bin/env python
from argparse import ArgumentParser, FileType
from ConfigParser import SafeConfigParser as Parser
from os import urandom
from base64 import b64encode


if __name__ == '__main__':
    ap = ArgumentParser(description='Combine two ini files.')
    ap.add_argument('source', type=FileType('r'),
                    help='The source file')
    ap.add_argument('overlay', type=FileType('r'),
                    help='The overlay file')
    ap.add_argument('result', type=FileType('w'),
                    help='The resulting file')
    args = ap.parse_args()
    source = Parser()
    source.readfp(args.source)
    overlay = Parser()
    overlay.readfp(args.overlay)
    for section in overlay.sections():
        if section != 'DEFAULT' and not source.has_section(section):
            source.add_section(section)
        for option in overlay.options(section):
            value = overlay.get(section, option)
            # Special case: {random66} => random string of 66*(4/3) characters
            if value.startswith('{random') and value.endswith("}"):
                value = b64encode(urandom(int(value[7:-1])))
            source.set(section, option, value)
    source.write(args.result)
