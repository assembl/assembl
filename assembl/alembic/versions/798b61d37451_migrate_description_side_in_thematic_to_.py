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
    	# op.drop_table('thematic')
        # op.drop_column('thematic', "video_description_side_id")
        op.add_column('announce', sa.Column('quote_id', sa.Integer, sa.ForeignKey('langstring.id')))
        op.drop_column("vote_session", "title")
        op.drop_column("vote_session", "sub_title")
        op.drop_column("vote_session", "instructions_section_title")
        op.drop_column("vote_session", "instructions_section_content")
        op.drop_column("vote_session", "discussion_phase_id")
        op.add_column("vote_session", sa.Column('idea_id', sa.Integer, sa.ForeignKey(m.Idea.id), nullable=False))

    # Do stuff with the app's models here.
    # from assembl import models as m
    # db = m.get_session_maker()()
    # with transaction.manager:
    #     thematics = db.query(m.Thematic).all()
    #     announcements = db.query(m.IdeaAnnouncement)
    #     for thematic in thematics:
    #     	thematic.sqla_type = 'idea'
        	# thematic_announcement = announcements.filter(m.IdeaAnnouncement.idea_id==thematic.id).first()
        	# if thematic_announcement:
        	# 	thematic_announcement.quote_id = thematic.video_description_side_id


def downgrade(pyramid_env):
	from assembl import models as m
    with context.begin_transaction():
        op.drop_column('announce', 'quote_id')
        op.add_column('vote_session', sa.Column('discussion_phase_id', sa.Integer, sa.ForeignKey('discussion_phase.id')))
        op.add_column('vote_session', sa.Column('title_id', sa.Integer, sa.ForeignKey(m.LangString.id), nullable=True))
        op.add_column('vote_session', sa.Column('sub_title_id', sa.Integer, sa.ForeignKey(m.LangString.id), nullable=True))
        op.add_column('vote_session', sa.Column('instructions_section_title_id', sa.Integer, sa.ForeignKey(m.LangString.id), nullable=True))
        op.add_column('vote_session', sa.Column('instructions_section_content', sa.Integer, sa.ForeignKey(m.LangString.id), nullable=True))