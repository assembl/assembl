import pg8000
import boto3
import os
import base64
import json


def lambda_handler(input, ctx):
    sm = boto3.client('secretsmanager')
    response = sm.get_secret_value(SecretId='db_password_assembl')
    if 'SecretString' in response:
        info = response['SecretString']
    else:
        info = base64.b64decode(response['SecretBinary'])
    info = json.loads(info)
    database = input.get('database', os.environ.get('database', 'assembl'))
    cnx = pg8000.core.Connection(
        info['username'],
        info['host'], None,
        int(info['port']),
        database,
        info['password'],
        False, 1000, 'assembl', 100)
    cur = cnx.cursor()
    try:
        cur.execute("SELECT 1 FROM pg_user WHERE usename = 'assembl_user'")
        if len(list(cur)):
            return "exists"
        else:
            cur.execute("CREATE USER assembl_user with login createdb")
            cnx.commit()
            cur.execute("GRANT rds_iam TO assembl_user")
            cnx.commit()
            cur.execute("ALTER DATABASE %s OWNER TO assembl_user" % database)
            cnx.commit()
            return "created"
    finally:
        cnx.close()
