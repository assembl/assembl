"""Syntheses for discussions without them

Revision ID: 3525142c66cb
Revises: 4f44fb7f3d6a
Create Date: 2013-09-06 12:55:17.082446

"""

# revision identifiers, used by Alembic.
revision = '3525142c66cb'
down_revision = '4f44fb7f3d6a'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.lib import config


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    db = m.get_session_maker()()
    with transaction.manager:
        discussions_without_synthesis = db.query(
            m.Discussion
        ).outerjoin(
            m.Synthesis
        ).filter(
            m.Synthesis.discussion_id == None
        )

        for discussion in discussions_without_synthesis:
            discussion.synthesis = m.Synthesis(discussion=discussion)


def downgrade(pyramid_env):
    with context.begin_transaction():
        ### There is no way back. ###
        pass
