"""split widgets

Revision ID: 58ad1d489e56
Revises: 2f52aea29238
Create Date: 2014-06-02 12:16:36.368688

"""

# revision identifiers, used by Alembic.
revision = '58ad1d489e56'
down_revision = '2f52aea29238'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'idea_view_widget',
            sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'widget.id', ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True),
            sa.Column(
                'main_idea_view_id', sa.Integer, sa.ForeignKey(
                    'idea_graph_view.id', ondelete="CASCADE",
                    onupdate="CASCADE"),
                nullable=True))
        op.execute("""INSERT INTO idea_view_widget (id, main_idea_view_id)
            SELECT id, main_idea_view_id FROM widget
            WHERE widget_type = 'creativity'""")
        op.execute("""UPDATE widget SET type = 'creativity_widget'
                      WHERE widget_type = 'creativity'""")
        op.execute("""UPDATE widget SET type = 'multicriterion_voting_widget'
                      WHERE widget_type = 'vote'""")
        op.drop_column('widget', 'widget_type')
        op.drop_column('widget', 'main_idea_view_id')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('widget', sa.Column(
            'widget_type', sa.String(120), nullable=False))
        op.add_column('widget', sa.Column(
            'main_idea_view_id', sa.Integer, sa.ForeignKey(
                'idea_graph_view.id', ondelete="CASCADE",
                onupdate="CASCADE"),
            nullable=True))
        op.execute("""UPDATE widget SET widget_type = 'creativity'
                      WHERE type = 'creativity_widget'""")
        op.execute("""UPDATE widget SET widget_type = 'vote'
                      WHERE type = 'multicriterion_voting_widget'""")
        op.execute("UPDATE widget SET widget_type ='widget'")
        op.execute("""UPDATE widget SET main_idea_view_id = (
            SELECT main_idea_view_id FROM idea_view_widget
            WHERE idea_view_widget.id = widget.id)""")
        op.drop_table('idea_view_widget')
