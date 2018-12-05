"""migrate_description_side_in_thematic_to_quote_in_announcement

Revision ID: 798b61d37451
Revises: de9ade82771c
Create Date: 2018-12-04 17:01:21.940162

"""

# revision identifiers, used by Alembic.
revision = '798b61d37451'
down_revision = 'de9ade82771c'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        # op.drop_column('thematic', "video_description_side_id")
        op.add_column('announce', sa.Column('quote_id',
            sa.Integer, sa.ForeignKey('langstring.id'))
        )

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        thematics = db.query(m.Thematic).all()
        announcements = db.query(m.Announcement)
        for thematic in thematics:
        	thematic.sqla_type = 'idea'
        	thematic_announcement = announcements.filter(idea_id==thematic.id).first()
        	thematic_announcement.quote_id = thematic.video_description_side_id
        db.commit()

    with context.begin_transaction():
    	op.drop_table('thematic')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('thematic', sa.Column('video_description_side_id', sa.Integer, sa.ForeignKey('langstring.id')))
        op.drop_column('announce', 'quote_id')
