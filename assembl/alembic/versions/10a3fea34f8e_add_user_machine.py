"""add_user_machine

Revision ID: 10a3fea34f8e
Revises: 2d0777b24f0d
Create Date: 2018-07-04 18:01:09.655927

"""

# revision identifiers, used by Alembic.
revision = '10a3fea34f8e'
down_revision = '2d0777b24f0d'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    from assembl.models.idea_content_link import ExtractStates, extract_states_identifiers
    with context.begin_transaction():
        schema = config.get('db_schema')
        # User can be a machine
        op.add_column(
            'user', sa.Column('is_machine',
            sa.Boolean(), default=False, server_default='0'))
        # Add the extract state: The extract can be Published or Submitted
        extract_states = sa.Enum(*extract_states_identifiers, name='extract_states')
        extract_states.create(op.get_bind())
        op.add_column(
            'extract',
            sa.Column(
                'extract_state',
                sa.Enum(*extract_states_identifiers, name='extract_states'),
                nullable=False,
                default=ExtractStates.PUBLISHED.value,
                server_default=ExtractStates.PUBLISHED.value),
                schema=schema
            )
    
    # Add the machine user
    db = m.get_session_maker()()
    with transaction.manager:
        m.User.populate_db(db)


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('user', 'is_machine')
        sa.Enum(name='extract_states').drop(op.get_bind(), checkfirst=False)