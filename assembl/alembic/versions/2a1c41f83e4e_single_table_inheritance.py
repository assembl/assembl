"""single table inheritance

Revision ID: 2a1c41f83e4e
Revises: 2f52aea29238
Create Date: 2014-06-01 16:38:59.184729

"""

# revision identifiers, used by Alembic.
revision = '2a1c41f83e4e'
down_revision = '2f52aea29238'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('table_of_contents')
        op.drop_table('root_idea')
        op.drop_table('idea_content_widget_link')
        op.drop_table('idea_related_post_link')
        op.drop_table('idea_thread_context_break_link')
        op.drop_table('idea_content_negative_link')

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'table_of_contents', sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'idea_graph_view.id',
                    ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True))
        op.execute("""INSERT INTO table_of_contents (id) 
            SELECT id FROM idea_graph_view
            WHERE type = 'table_of_contents'""")
        op.create_table(
            'root_idea', sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'idea.id',
                    ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True))
        op.execute("""INSERT INTO root_idea (id) 
            SELECT id FROM idea
            WHERE sqla_type = 'assembl:RootIdea'""")
        op.create_table(
            'idea_content_widget_link', sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'idea_content_link.id',
                    ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True))
        op.execute("""INSERT INTO idea_content_widget_link (id) 
            SELECT id FROM idea_content_link
            WHERE type = 'assembl:postHiddenLinkedToIdea'""")
        op.create_table(
            'idea_related_post_link', sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'idea_content_positive_link.id',
                    ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True))
        op.execute("""INSERT INTO idea_related_post_link (id) 
            SELECT id FROM idea_content_link
            WHERE type = 'assembl:postLinkedToIdea'""")
        op.create_table(
            'idea_content_negative_link', sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'idea_content_link.id',
                    ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True))
        op.execute("""INSERT INTO idea_content_negative_link (id) 
            SELECT id FROM idea_content_link
            WHERE type in ('assembl:postDelinkedToIdea',
                           'assembl:postDelinkedToIdea_abstract')""")
        op.create_table(
            'idea_thread_context_break_link', sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'idea_content_negative_link.id',
                    ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True))
        op.execute("""INSERT INTO idea_thread_context_break_link (id) 
            SELECT id FROM idea_content_link
            WHERE type = 'assembl:postDelinkedToIdea'""")
