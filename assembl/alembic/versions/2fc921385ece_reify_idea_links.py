"""reify idea links

Revision ID: 2fc921385ece
Revises: 30b910cff69d
Create Date: 2013-12-12 21:47:45.418761

"""

# revision identifiers, used by Alembic.
revision = '2fc921385ece'
down_revision = '30b910cff69d'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idea_association', sa.Column(
            'id', sa.Integer, primary_key=True))
        op.create_primary_key(
            'pk_idea_association', 'idea_association', ['id'])

def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint('pk_idea_association', 'idea_association')
        op.drop_column('idea_association', 'id')
