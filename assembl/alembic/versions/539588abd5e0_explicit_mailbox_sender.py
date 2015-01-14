"""explicit mailbox sender

Revision ID: 539588abd5e0
Revises: 187cdadb065f
Create Date: 2014-11-11 16:47:00.522696

"""

# revision identifiers, used by Alembic.
revision = '539588abd5e0'
down_revision = '187cdadb065f'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            "mailbox",
            sa.Column("admin_sender", sa.String))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    admin_email = None
    for section in ('app:main', 'app:assembl'):
        try:
            admin_email = context.config.get_section_option(
                section, 'assembl.admin_email')
        except:
            pass
    assert admin_email
    with transaction.manager:
        for s in db.query(m.AbstractMailbox):
            s.admin_sender = admin_email


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column("mailbox", "admin_sender")
