import argparse

import transaction
from sqlalchemy.orm import undefer

from assembl.lib.sqla import mark_changed
from assembl.lib.antivirus import get_antivirus
from assembl.scripts import boostrap_configuration


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("configuration", help="configuration file")
    parser.add_argument("-d", "--discussion", default=None,
                        help="slug of single discussion to check (or all discussions)")
    parser.add_argument("-r", "--reset", action="store_true",
                        help="Reset status of all files")
    parser.add_argument("-a", "--antivirus",
                        default="assembl.lib.antivirus.SophosAntiVirus",
                        help="antivirus class")
    args = parser.parse_args()
    session = boostrap_configuration(args.configuration)
    antivirus = get_antivirus(args.antivirus)
    from assembl.models import File, Discussion
    from assembl.models.attachment import AntiVirusStatus
    files = session.query(File)
    if args.discussion:
        (discussion_id,) = session.query(Discussion.id).filter_by(slug=args.discussion).first()
        files = files.filter_by(discussion_id=discussion_id)
    if args.reset:
        with transaction.manager:
            files.update({
                File.av_checked: AntiVirusStatus.unchecked.name})
            mark_changed(session)
    with transaction.manager:
        file_ids = files.with_entities(File.id).all()
    for file_id in file_ids:
        with transaction.manager:
            file_obj = session.query(File).options(undefer(File.data)).get(file_id)
            file_obj.ensure_virus_checked(antivirus)


if __name__ == '__main__':
    main()
