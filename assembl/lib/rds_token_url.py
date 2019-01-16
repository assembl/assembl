from datetime import datetime, timedelta

from pytz import UTC
from sqlalchemy.engine.url import URL
import boto3


class RdsTokenUrl(URL):
    """An URL that uses IAM connection tokens as passwords"""
    def __init__(
            self, drivername, region=None, username=None, host=None,
            session_name=None, port=None, database=None, query=None):
        super(RdsTokenUrl, self).__init__(
            drivername, username=username, host=host, port=port or 5432,
            database=database, query=query)
        self.aws_region = region

    def get_rds_client(self):
        if not getattr(self, 'rds_client', None):
            self.rds_client = boto3.client(
                'rds', self.aws_region)
        return self.rds_client

    @property
    def password(self):
        rds = self.get_rds_client()
        return rds.generate_db_auth_token(
            DBHostname=self.host,
            Port=self.port,
            DBUsername=self.username,
            Region=self.aws_region)


class IamRoleRdsTokenUrl(RdsTokenUrl):
    """Assume a specific role before you get the client.
    AWS bug: you have to assume your own role to connect."""
    def __init__(
            self, drivername, iam_role, region=None, username=None,
            host=None, port=None, database=None,
            query=None, session_name=None):
        super(IamRoleRdsTokenUrl, self).__init__(
            drivername, region=region, username=username, host=host,
            port=port, database=database, query=query)
        self.iam_role = iam_role
        self.sts_session_name = session_name or 'assembl'
        self.sts_client = boto3.client('sts', self.aws_region)

    def _needs_sts_role(self):
        role = getattr(self, 'sts_role', None)
        if not role:
            return True
        expiry = role['Credentials']['Expiration']
        if expiry.tzinfo:
            expiry = expiry.astimezone(UTC).replace(tzinfo=None)
        return (expiry - datetime.utcnow()) < timedelta(minutes=10)

    def get_sts_role(self):
        if self._needs_sts_role():
            self.sts_role = self.sts_client.assume_role(
                RoleArn=self.iam_role,
                RoleSessionName=self.sts_session_name)
            self.rds_client = None
        return self.sts_role

    def get_rds_client(self):
        if not getattr(self, 'rds_client', None):
            role = self.get_sts_role()
            credentials = role['Credentials']
            self.rds_client = boto3.client(
                'rds', self.aws_region,
                aws_access_key_id=credentials['AccessKeyId'],
                aws_secret_access_key=credentials['SecretAccessKey'],
                aws_session_token=credentials['SessionToken'])
        return self.rds_client
