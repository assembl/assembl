"""IdeaContentWidgetLink are positive links

Revision ID: 172cd43879ac
Revises: 2c5b4e40daea
Create Date: 2015-07-29 09:36:34.712974

"""

# revision identifiers, used by Alembic.
revision = '172cd43879ac'
down_revision = '2c5b4e40daea'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("""INSERT INTO idea_content_positive_link (id)
            SELECT id FROM idea_content_widget_link""")
    with context.begin_transaction():
        try:
            op.drop_constraint(
                "idea_content_widget_link_idea_content_link_id_id",
                "idea_content_widget_link")
        except:
            pass
    with context.begin_transaction():
        op.create_foreign_key(
            "idea_content_widget_link_idea_content_positive_link_id_id",
            "idea_content_widget_link", "idea_content_positive_link",
            ["id"], ["id"])


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(
            "idea_content_widget_link_idea_content_positive_link_id_id",
            "idea_content_widget_link")
        op.create_foreign_key(
            "idea_content_widget_link_idea_content_link_id_id",
            "idea_content_widget_link", "idea_content_link",
            ["id"], ["id"])
    with context.begin_transaction():
        op.execute("""DELETE FROM idea_content_positive_link WHERE id IN
            (SELECT id FROM idea_content_widget_link)""")
