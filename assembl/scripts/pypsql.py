#!/usr/bin/env python
"Emulate psql in Python, because psql does not like running from within fab."

import argparse
import getpass
import psycopg2


def main():
    parser = argparse.ArgumentParser(description='Call postgresql.')
    parser.add_argument('--host', '-n')
    parser.add_argument('--user', '-u', help='database user')
    parser.add_argument('--password', '-p', help='database password')
    parser.add_argument('--ask_password', '-P', action="store_true",
                        help='ask for database password',)
    parser.add_argument('--database', '-d', help="database")
    parser.add_argument('--print_one', '-1', action="store_true",
                        help="print first return row (fails if none)")
    parser.add_argument('commands', help="sql commands")
    args = parser.parse_args()
    user = args.user or getpass.getuser()
    password = args.password
    if args.ask_password:
        password = getpass.getpass("password: ")
    database = args.database or "postgres"
    host = args.host
    # TODO: Better check than localhost.
    if host == 'localhost' and user == getpass.getuser() and password is None:
        host = None
    cx = psycopg2.connect(user=user, password=password, database=database, host=host)
    cur = cx.cursor()
    cur.execute(args.commands)
    if args.print_one:
        result = cur.fetchone()
        assert result
        print result

if __name__ == '__main__':
    main()
