"""corrupt idea_related_post_link

Revision ID: 267b2f56d7b0
Revises: 4097019d6357
Create Date: 2016-05-12 10:34:46.200057

"""

# revision identifiers, used by Alembic.
revision = '267b2f56d7b0'
down_revision = '4097019d6357'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        errors = list(db.execute(
            """SELECT idea_content_link.id, post.creator_id FROM idea_content_link
                JOIN post ON content_id = post.id
                WHERE idea_content_link.type = 'assembl:postLinkedToIdea'
                AND idea_content_link.creator_id=-1"""))
        for id, contributor in errors:
            db.execute(
                "UPDATE idea_content_link SET creator_id={contributor} WHERE id = {id}".format(
                    id=id, contributor=contributor))
        mark_changed()


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
