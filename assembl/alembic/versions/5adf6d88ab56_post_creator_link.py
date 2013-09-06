"""post creator link

Revision ID: 5adf6d88ab56
Revises: 3525142c66cb
Create Date: 2013-09-05 16:12:46.180472

"""

# revision identifiers, used by Alembic.
revision = '5adf6d88ab56'
down_revision = '3525142c66cb'

from alembic import context, op
import sqlalchemy as sa
import transaction
from email.utils import parseaddr, formataddr

from assembl import models as m
from assembl.lib import config
from assembl.lib.sqla import Base as SQLAlchemyBaseModel
from assembl.models import Email, EmailAccount

db = m.DBSession


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('post', sa.Column(
            u'creator_id', sa.Integer, sa.ForeignKey('agent_profile.id')))
    SQLAlchemyBaseModel.metadata.bind = op.get_bind()

    # Do stuff with the app's models here.
    with transaction.manager:
        for mail in db.query(Email).all():
            sender_name, sender_email = parseaddr(mail.sender)
            account = EmailAccount.get_or_make_profile(
                db, sender_email, sender_name)
            mail.post.creator = account.profile


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('post', u'creator_id')
