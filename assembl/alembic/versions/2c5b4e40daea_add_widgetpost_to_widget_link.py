"""add WidgetPost to Widget link

Revision ID: 2c5b4e40daea
Revises: d04b378fedf
Create Date: 2015-07-24 12:26:13.641230

"""

# revision identifiers, used by Alembic.
revision = '2c5b4e40daea'
down_revision = 'd04b378fedf'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'post_with_metadata', sa.Column(
                'widget_id', sa.Integer, sa.ForeignKey(
                    "widget.id",
                    ondelete='SET NULL',
                    onupdate='CASCADE')))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        op.execute("""UPDATE post_with_metadata SET widget_id = (
            SELECT widget_id FROM idea_widget_link 
            JOIN idea_proposal_post on (idea_proposal_post.idea_id = idea_widget_link.idea_id)
            WHERE idea_widget_link.type='generated_idea_widget_link'
            AND idea_proposal_post.id = post_with_metadata.id)""")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('post_with_metadata', 'widget_id')
