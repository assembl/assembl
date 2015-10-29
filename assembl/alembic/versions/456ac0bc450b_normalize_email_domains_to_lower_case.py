"""normalize email domains to lower case

Revision ID: 456ac0bc450b
Revises: 26caf0c8f768
Create Date: 2015-10-29 13:18:31.935337

"""

# revision identifiers, used by Alembic.
revision = '456ac0bc450b'
down_revision = '26caf0c8f768'

from alembic import context, op
import sqlalchemy as sa
import transaction
from assembl.lib.sqla_types import EmailString
from pyisemail import is_email

from assembl.lib import config


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for acc in db.query(m.AbstractAgentAccount):
            if not acc.email:
                continue
            if not is_email(acc.email):
                acc.verified = False
            else:
                acc.email = EmailString.normalize_email_case(acc.email)
        for user in db.query(m.User).filter(m.User.preferred_email != None):
            if not is_email(user.preferred_email):
                user.preferred_email = None
            else:
                user.preferred_email = EmailString.normalize_email_case(
                    user.preferred_email)


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
