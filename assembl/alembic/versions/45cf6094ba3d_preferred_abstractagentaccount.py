"""preferred AbstractAgentAccount

Revision ID: 45cf6094ba3d
Revises: 3e12427ba98d
Create Date: 2015-02-13 15:38:59.144635

"""

# revision identifiers, used by Alembic.
revision = '45cf6094ba3d'
down_revision = '3e12427ba98d'

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.orm.attributes import flag_modified
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'abstract_agent_account',
            sa.Column("preferred", sa.SmallInteger,
                      default=False, server_default='0'))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    aaat = m.AbstractAgentAccount.__mapper__.local_table
    emt = m.EmailAccount.__mapper__.local_table

    with transaction.manager:
        # Start with a blanket 0
        db.execute(aaat.update().values(
            preferred=0))
        # get from previous values
        stmt = sa.select([emt.c.preferred]).where(
            aaat.c.id == emt.c.id)
        db.execute(aaat.update().where(
            aaat.c.type == 'agent_email_account').values(preferred=stmt))
        # Force update, transaction manager saw nothing
        aaa = db.query(m.AbstractAgentAccount).first()
        flag_modified(aaa, 'profile_id')

    with context.begin_transaction():
        db.execute('ALTER TABLE abstract_agent_account ADD CHECK (preferred IN (0, 1))')
        op.drop_column('agent_email_account', "preferred")



def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'agent_email_account',
            sa.Column("preferred", sa.SmallInteger,
                      default=False, server_default='0'))
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    aaat = m.AbstractAgentAccount.__mapper__.local_table
    emt = m.EmailAccount.__mapper__.local_table

    with transaction.manager:
        # get from previous values
        stmt = sa.select([aaat.c.preferred]).where(
            (aaat.c.id == emt.c.id) &
            (aaat.c.type == 'agent_email_account'))
        db.execute(emt.update().values(preferred=stmt))
        # Force update, transaction manager saw nothing
        aaa = db.query(m.AbstractAgentAccount).first()
        flag_modified(aaa, 'profile_id')

    with context.begin_transaction():
        db.execute('ALTER TABLE agent_email_account ADD CHECK (preferred IN (0, 1))')
        op.drop_column(
            'abstract_agent_account', "preferred")
