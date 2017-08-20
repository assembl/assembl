"""video_desc_extended

Revision ID: 9218849f9579
Revises: ad7df254225d
Create Date: 2017-07-19 22:44:23.204035

"""

# revision identifiers, used by Alembic.
revision = '9218849f9579'
down_revision = 'ad7df254225d'

from alembic import context, op
import sqlalchemy as sa
import transaction
from assembl.lib.sqla import mark_changed


from assembl.lib import config


def put_new_langstring(thematic, attr, db):
    from assembl import models
    langstring = getattr(thematic, attr)
    new_langstring = models.LangString()
    old_entries = langstring.entries
    for entry in old_entries:
        entry.clone(new_langstring, db=db)
    return new_langstring


def upgrade(pyramid_env):
    with context.begin_transaction():

        op.add_column('thematic', sa.Column('video_description_side_id',
            sa.Integer, sa.ForeignKey('langstring.id'))
        )

    # Do stuff with the app's models here.
    from assembl import models
    db = models.get_session_maker()()

    with transaction.manager:
        current_top_langstrings = [x for x
                                   in db.query(models.Thematic).all()
                                   if x.video_description_top is not None]

        new_langstrings = map(lambda x: put_new_langstring(x,
                              'video_description_top', db),
                              current_top_langstrings)
        for new_langstring in new_langstrings:
            db.add(new_langstring)

        mark_changed()


def downgrade(pyramid_env):
    with transaction.manager:
        op.execute("UPDATE thematic SET video_description_top_id=video_description_side_id")
        mark_changed()

    with context.begin_transaction():
        op.drop_column('thematic', 'video_description_side_id')
