"""rdf in idea type

Revision ID: 2f52aea29238
Revises: 10159cb599ff
Create Date: 2014-05-31 21:14:10.859165

"""

# revision identifiers, used by Alembic.
revision = '2f52aea29238'
down_revision = '10159cb599ff'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        # Some old bad data makes the first update fail.
        op.execute("""DELETE FROM idea_idea_link WHERE id IN (
            SELECT idea_idea_link.id FROM idea_idea_link
            LEFT OUTER JOIN idea ON (idea.id = idea_idea_link.source_id)
            WHERE idea.id IS NULL)""")
        op.execute("""DELETE FROM idea_idea_link WHERE id IN (
            SELECT idea_idea_link.id FROM idea_idea_link
            LEFT OUTER JOIN idea ON (idea.id = idea_idea_link.target_id)
            WHERE idea.id IS NULL)""")
        op.add_column(
                    'idea_idea_link', sa.Column(
                        'sqla_type', sa.String(60), nullable=False))
        op.execute("update idea_idea_link set sqla_type='idea:InclusionRelation'")
        op.execute("update idea set sqla_type='idea:GenericIdeaNode' where sqla_type='idea'")
        op.execute(" update idea set sqla_type='assembl:RootIdea' where sqla_type='root_idea'")
        op.execute("update idea_content_link set type='assembl:relatedToIdea' where type='idea_content_link'")
        op.execute(" update idea_content_link set type='assembl:postHiddenLinkedToIdea' where type='idea_content_widget_link'")
        op.execute(" update idea_content_link set type='assembl:postLinkedToIdea_abstract' where type='idea_content_positive_link'")
        op.execute("  update idea_content_link set type='assembl:postLinkedToIdea' where type='idea_related_post_link'")
        op.execute("  update idea_content_link set type='assembl:postExtractRelatedToIdea' where type='extract'")
        op.execute(" update idea_content_link set type='assembl:postDelinkedToIdea_abstract' where type='idea_content_negative_link'")
        op.execute("  update idea_content_link set type='assembl:postDelinkedToIdea' where type='idea_thread_context_break_link'")

def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('idea_idea_link', 'sqla_type')
        op.execute("update idea set sqla_type='idea' where sqla_type='idea:GenericIdeaNode'")
        op.execute("update idea set sqla_type='root_idea' where sqla_type='assembl:RootIdea'")
        op.execute("update idea_content_link set type='idea_content_link' where type='assembl:relatedToIdea'")
        op.execute(" update idea_content_link set type='idea_content_widget_link' where type='assembl:postHiddenLinkedToIdea'")
        op.execute(" update idea_content_link set type='idea_content_positive_link' where type='assembl:postLinkedToIdea_abstract'")
        op.execute("  update idea_content_link set type='idea_related_post_link' where type='assembl:postLinkedToIdea'")
        op.execute("  update idea_content_link set type='extract' where type='assembl:postExtractRelatedToIdea'")
        op.execute(" update idea_content_link set type='idea_content_negative_link' where type='assembl:postDelinkedToIdea_abstract'")
        op.execute("  update idea_content_link set type='idea_thread_context_break_link' where type='assembl:postDelinkedToIdea'")
