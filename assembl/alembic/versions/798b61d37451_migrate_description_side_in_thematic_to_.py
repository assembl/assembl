"""migrate_description_side_in_thematic_to_quote_in_announcement

Revision ID: 798b61d37451
Revises: d813ab110e00
Create Date: 2018-12-04 17:01:21.940162

"""

# revision identifiers, used by Alembic.
revision = '798b61d37451'
down_revision = 'd813ab110e00'

from alembic import context, op
import sqlalchemy as sa
import transaction
from assembl.lib import config
from assembl.lib.sqla import mark_changed

def upgrade(pyramid_env):
    from assembl import models as m
    with context.begin_transaction():
        op.execute("DELETE FROM attachment WHERE type='vote_session_attachment'")
        op.execute('DELETE FROM idea_vote')
        op.execute('DELETE FROM token_category_specification')
        op.execute('DELETE FROM vote_specification')
        op.execute('DELETE FROM vote_session')
        # convert thematic to idea
        op.execute("UPDATE idea SET message_view_override='thread' WHERE hidden=false AND message_view_override IS NULL")
        op.execute("UPDATE idea SET message_view_override='survey' WHERE sqla_type='thematic' AND hidden=false")
        op.execute("UPDATE idea SET sqla_type='idea' WHERE sqla_type='thematic'")
        mark_changed()
        # this drop video module associated to survey ideas, we don't do migration to announcement
        op.drop_table('thematic')
        op.add_column('announce', sa.Column('quote_id', sa.Integer, sa.ForeignKey('langstring.id')))
        op.drop_column("vote_session", "title_id")
        op.drop_column("vote_session", "sub_title_id")
        op.drop_column("vote_session", "instructions_section_title_id")
        op.drop_column("vote_session", "instructions_section_content_id")
        op.drop_column("vote_session", "discussion_phase_id")
        op.add_column("vote_session", sa.Column(
            'idea_id', sa.Integer, sa.ForeignKey(
                m.Idea.id, onupdate="CASCADE", ondelete='CASCADE'),
            nullable=False, unique=True))
        op.create_unique_constraint("discussion_phase_root_idea_id_key", "discussion_phase", ["root_idea_id"])

    with transaction.manager:
        from assembl.indexing import join_transaction
        join_transaction()
        # delete all vote proposals and phase
        vote_session_phases = m.TimelineEvent.query.filter(m.TimelineEvent.identifier == 'voteSession').all()
        roots = [phase.root_idea for phase in vote_session_phases if phase.root_idea is not None]
        for root in roots:
            for child in root.get_children():
                child.db.delete(child)
            root.db.delete(root)

        for phase in vote_session_phases:
            phase.db.delete(phase)

        # set messages_in_parent to False for all ideas
        for idea in m.Idea.query.filter(~m.Idea.sqla_type.in_(('question', 'vote_proposal'))):
            idea.messages_in_parent = False


def downgrade(pyramid_env):
    from assembl import models as m
    with context.begin_transaction():
        op.drop_column('announce', 'quote_id')
        op.drop_column('vote_session', 'idea_id')
        op.add_column('vote_session', sa.Column('discussion_phase_id', sa.Integer, sa.ForeignKey('discussion_phase.id')))
        op.add_column('vote_session', sa.Column('title_id', sa.Integer, sa.ForeignKey(m.LangString.id), nullable=True))
        op.add_column('vote_session', sa.Column('sub_title_id', sa.Integer, sa.ForeignKey(m.LangString.id), nullable=True))
        op.add_column('vote_session', sa.Column('instructions_section_title_id', sa.Integer, sa.ForeignKey(m.LangString.id), nullable=True))
        op.add_column('vote_session', sa.Column('instructions_section_content_id', sa.Integer, sa.ForeignKey(m.LangString.id), nullable=True))
        op.drop_constraint("discussion_phase_root_idea_id_key", "discussion_phase")
