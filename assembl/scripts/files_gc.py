from __future__ import print_function
import argparse
import os

import transaction
from sqlalchemy.orm import undefer

from assembl.lib.sqla import mark_changed
from assembl.lib.antivirus import get_antivirus
from assembl.scripts import boostrap_configuration


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("configuration", help="configuration file")
    parser.add_argument("-d", "--delete", action="store_true",
                        help="Actually delete the extraneous files")
    args = parser.parse_args()
    db = boostrap_configuration(args.configuration)
    from assembl.models import File
    hashfs = File.hashfs
    ids = {x for (x,) in db.query(File.file_identity)}
    for root, dirs, files in os.walk(hashfs.root):
        base = ''.join(root[len(hashfs.root):].split('/'))
        for fname in files:
            id = base + fname.split('.')[0]
            if id not in ids:
                print("Unknown file: ", "/".join([root]+dirs+[fname]))
                if args.delete:
                    hashfs.delete(id)



if __name__ == '__main__':
    main()
