"""remove RestrictedAccessModel

Revision ID: 43e84f11dbaf
Revises: 4893a7f428c3
Create Date: 2013-08-08 22:19:56.378549

"""

# revision identifiers, used by Alembic.
revision = '43e84f11dbaf'
down_revision = '4893a7f428c3'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint('discussion_id_fkey', 'discussion')
        op.alter_column('discussion', 'id', autoincrement=True)
        op.drop_column('action', 'subject_id')
        op.add_column('action', sa.Column('type', sa.String(60)))
        op.drop_table('restricted_access_model')

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.alter_column('discussion', 'id', autoincrement=False)
        op.create_table('restricted_access_model',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('owner_id', sa.Integer, sa.ForeignKey(
                'agent_profile.id', ondelete='CASCADE')))
        # TODO: Somehow recreate restricted_access_models for the discussions. Sigh.
        op.create_foreign_key(
            'discussion_id_fkey', 'discussion', 'restricted_access_model',
            ['id'], ['id'])
        op.drop_column('action', 'type')
        op.add_column('action', sa.Column(
            'subject_id', sa.Integer, 
            sa.ForeignKey('restricted_access_model.id', ondelete='CASCADE'),
            nullable=False))
