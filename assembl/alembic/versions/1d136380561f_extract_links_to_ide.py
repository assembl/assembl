"""Extract links to idea and post.

Revision ID: 1d136380561f
Revises: 314c93b20f51
Create Date: 2013-08-08 12:38:42.533051

"""

# revision identifiers, used by Alembic.
revision = '1d136380561f'
down_revision = '314c93b20f51'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m

db = m.DBSession


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('extract', sa.Column(
            'body', sa.UnicodeText, nullable=False))
        op.add_column('extract', sa.Column(
            'source_id', sa.Integer, sa.ForeignKey('content.id')))
        op.add_column('extract', sa.Column(
            'idea_id', sa.Integer, sa.ForeignKey('idea.id'), nullable=True))
        op.add_column('extract', sa.Column(
            'creator_id', sa.Integer, sa.ForeignKey('agent_profile.id')))
        op.add_column('extract', sa.Column(
            'owner_id', sa.Integer, sa.ForeignKey('agent_profile.id')))

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('extract', 'body')
        op.drop_column('extract', 'source_id')
        op.drop_column('extract', 'idea_id')
        op.drop_column('extract', 'creator_id')
        op.drop_column('extract', 'owner_id')
