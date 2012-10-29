""" Test connecting to the configured in IMAP4 server. """

from argparse import ArgumentParser

import transaction

from pyramid.paster import bootstrap

from ..api import post as api
from ..lib.email import IMAP4Mailbox, parsedate
from ..lib.scripting import exitonbreak


@exitonbreak
def main():
    args = parse_args()
    env = bootstrap(args.config_uri)

    try:
        imap = IMAP4Mailbox(settings=env['registry'].settings)
        if imap.connection:
            print('Successfully connected to host %r, mailbox %r.'
                  % (imap.host, imap.mailbox))

        if args.list_:
            print('Listing mailbox messages...')
            for msg in imap.messages:
                print(parsedate(msg['date']), msg['subject'])
            print('Finished.')

        if args.import_:
            count = 0
            print('Importing mailbox messages...'),
            with transaction.manager:
                for msg in imap.messages:
                    post = api.create(email_text=str(msg))
                    count += 1
            print('imported %d messages.' % count)
            print('Threading messages...'),
            with transaction.manager:
                posts = api.find()
                api.thread(posts)
            print('threaded %d messages.' % len(posts))
            print('Finished.')
    finally:
        imap.close()


def parse_args():
    parser = ArgumentParser(description=__doc__)

    group = parser.add_mutually_exclusive_group()
    group.add_argument('-l', '--list', dest='list_', action='store_true',
                       default=False, help='list mailbox content')
    group.add_argument('-i', '--import', dest='import_', action='store_true',
                       default=False, help='import mailbox content')

    parser.add_argument('config_uri', help='configuration to use')
    return parser.parse_args()


if __name__ == '__main__':
    main()
