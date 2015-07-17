"""obsolete notifications and unverified social accounts

Revision ID: 29f0f6751c2a
Revises: 165e8b786ca0
Create Date: 2015-07-17 08:53:39.676391

"""

# revision identifiers, used by Alembic.
revision = '29f0f6751c2a'
down_revision = '165e8b786ca0'

from datetime import datetime, timedelta

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # Do stuff with the app's models here.
    import assembl.models as m
    db = m.get_session_maker()()
    with transaction.manager:
        # Statute of limitation on old notifications.
        db.execute("""
            UPDATE notification SET delivery_state='EXPIRED' WHERE id IN (
                SELECT id FROM notification
                WHERE delivery_state IN ('DELIVERY_TEMPORARY_FAILURE','QUEUED')
                AND creation_date < '%s')""" % (
                    (datetime.now() - timedelta(days=7)).isoformat(),))
        # Enable social accounts
        ipa_types = [c.__mapper__.polymorphic_identity
                     for c in m.IdentityProviderAccount.get_subclasses()]
        db.execute("""
            UPDATE abstract_agent_account SET verified = 1 WHERE id IN (
                SELECT id FROM abstract_agent_account
                    WHERE not(verified) and type in ('%s'))"""
                   % "','".join(ipa_types))


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
