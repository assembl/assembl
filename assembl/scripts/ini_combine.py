#!/usr/bin/env python
import sys
from argparse import ArgumentParser, FileType
from ConfigParser import RawConfigParser as Parser
from os import urandom
from base64 import b64encode


if __name__ == '__main__':
    ap = ArgumentParser(
        description="""Combine a source ini file with an overlay ini file into a target ini file.
        You cannot edit in-place (use same source and destination). Source and overlay cannot both be stdin.
        Overlay values with a {randomN} format (N an integer), will be replaced with
        a random string of length 4*ceil(N/3).""")
    ap.add_argument('source', type=FileType('r'),
                    help='The source file (use - for stdin)')
    ap.add_argument('overlay', type=FileType('r'),
                    help='The overlay file (use - for stdin)')
    ap.add_argument('result', type=FileType('w'),
                    help='The resulting file (use - for stdout)')
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
