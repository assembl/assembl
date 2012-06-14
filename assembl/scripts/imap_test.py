""" Test connecting to the configured in IMAP4 server. """

from argparse import ArgumentParser

from pyramid.paster import bootstrap

from assembl.lib.email import IMAP4Mailbox, parsedate
from assembl.lib.scripting import exitonbreak


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
                print parsedate(msg['date']), msg['subject']
            print('Finished.')
    finally:
        imap.close()


def parse_args():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('-l', '--list', dest='list_', action='store_true',
                        default=False, help='list mailbox content')
    parser.add_argument('config_uri', help='configuration to use')
    return parser.parse_args()


if __name__ == '__main__':
    main()
