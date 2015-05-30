"""Isolate idea rdf type and add idea last_modified column

Revision ID: 43863df11763
Revises: 453f5e773eff
Create Date: 2015-05-29 16:37:36.125919

"""

# revision identifiers, used by Alembic.
revision = '43863df11763'
down_revision = '453f5e773eff'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed

def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idea', sa.Column(
            'rdf_type', sa.String(60), nullable=False,
            server_default='idea:GenericIdeaNode'))
        op.add_column('idea', sa.Column(
            'last_modified', sa.types.TIMESTAMP))
        op.add_column('idea_idea_link', sa.Column(
            'rdf_type', sa.String(60), nullable=False,
            server_default='idea:InclusionRelation'))
        op.drop_table("root_idea")

    with context.begin_transaction():
        op.execute('UPDATE idea SET "rdf_type" = "sqla_type"')
        op.execute('UPDATE idea_idea_link SET "rdf_type" = "sqla_type"')
        op.execute("UPDATE idea SET sqla_type = 'root_idea' WHERE sqla_type = 'assembl:RootIdea'")
        op.execute("UPDATE idea SET sqla_type = 'idea' WHERE sqla_type <> 'root_idea'")
        mark_changed()

    with context.begin_transaction():
        op.drop_column('idea_idea_link', 'sqla_type')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idea_idea_link', sa.Column(
            'sqla_type', sa.String(60), nullable=False))
        op.create_table('root_idea', sa.Column(
            'id', sa.Integer, sa.ForeignKey(
                'idea.id', ondelete='CASCADE', onupdate='CASCADE'),
            primary_key=True))
    with context.begin_transaction():
        op.execute('UPDATE idea SET "sqla_type" = "rdf_type"')
        op.execute('UPDATE idea_idea_link SET "sqla_type" = "rdf_type"')
        op.execute("INSERT INTO root_idea (id) SELECT id FROM idea WHERE sqla_type ='assembl:RootIdea'")
        mark_changed()
    with context.begin_transaction():
        op.drop_column('idea_idea_link', 'rdf_type')
        op.drop_column('idea', 'rdf_type')
        op.drop_column('idea', 'last_modified')
