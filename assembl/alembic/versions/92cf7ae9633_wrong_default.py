"""wrong default

Revision ID: 92cf7ae9633
Revises: 3eb0fa36d60a
Create Date: 2015-05-30 18:26:16.736917

"""

# revision identifiers, used by Alembic.
revision = '92cf7ae9633'
down_revision = '3eb0fa36d60a'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed

def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idea_idea_link', sa.Column(
            'rdf_temp', sa.String(60), nullable=False))
    with context.begin_transaction():
        op.execute('UPDATE idea_idea_link SET "rdf_temp" = "rdf_type"')
        op.execute('''UPDATE idea_idea_link
                    SET "rdf_temp" = 'idea:InclusionRelation'
                    WHERE "rdf_temp" = 'idea:GenericIdeaNode' ''')
        mark_changed()
    with context.begin_transaction():
        op.drop_column('idea_idea_link', 'rdf_type')
        op.add_column('idea_idea_link', sa.Column(
            'rdf_type', sa.String(60), nullable=False,
            server_default='idea:InclusionRelation'))
        op.drop_column('idea_idea_link', 'rdf_temp')


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
