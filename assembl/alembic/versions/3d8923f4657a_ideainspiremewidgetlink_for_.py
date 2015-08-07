"""IdeaInspireMeWidgetLink for InspirationWidget

Revision ID: 3d8923f4657a
Revises: 172cd43879ac
Create Date: 2015-08-07 16:55:36.495178

"""

# revision identifiers, used by Alembic.
revision = '3d8923f4657a'
down_revision = '172cd43879ac'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("""
            UPDATE idea_widget_link
            SET "type" = 'idea_inspire_me_widget_link'
            WHERE id IN (
                SELECT idea_widget_link.id FROM idea_widget_link
                    JOIN widget ON (widget.id = idea_widget_link.widget_id)
                    WHERE widget."type" = 'inspiration_widget'
                    AND idea_widget_link."type" = 'base_idea_widget_link') """)


def downgrade(pyramid_env):
    pass
