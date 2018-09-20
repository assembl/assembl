"""Add root_idea to DiscussionPhase

Revision ID: cdc98f9b55c2
Revises: fad90e3f18b4
Create Date: 2018-09-03 11:29:10.171065

"""

# revision identifiers, used by Alembic.
revision = 'cdc98f9b55c2'
down_revision = 'fad90e3f18b4'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('discussion_phase',
            sa.Column('root_idea_id', sa.Integer(), sa.ForeignKey('idea.id',
                onupdate="CASCADE", ondelete="SET NULL")))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for discussion in db.query(m.Discussion):
            root_ideas = {}
            for idea in discussion.root_idea.get_children():
                if idea.hidden and isinstance(idea, m.Thematic):
                    identifier = list(db.execute('SELECT identifier FROM thematic WHERE id={}'.format(idea.id)))[0][0]
                    root_ideas[identifier] = idea

            for phase in discussion.timeline_phases:
                if phase.identifier in root_ideas:  # survey, brightMirror
                    phase.is_thematics_table = True
                    phase.root_idea = root_ideas[phase.identifier]
                elif phase.identifier == 'voteSession' and phase.vote_session is not None:
                    identifier = 'voteSession{}'.format(phase.vote_session.id)
                    if identifier in root_ideas:
                        phase.is_thematics_table = True
                        phase.root_idea = root_ideas[identifier]

    with context.begin_transaction():
        op.drop_column('thematic', 'identifier')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('thematic', sa.Column('identifier', sa.String(60)))

    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for discussion in db.query(m.Discussion):
            for phase in discussion.timeline_phases:
                if phase.is_thematics_table:
                    if phase.identifier == 'voteSession':
                        identifier = 'voteSession{}'.format(phase.vote_session.id)
                        db.execute('UPDATE thematic SET identifier=:identifier WHERE id=:id',
                            {'identifier': identifier, 'id': phase.root_idea.id})
                    else:
                        db.execute('UPDATE thematic SET identifier=:identifier WHERE id=:id',
                            {'identifier': phase.identifier, 'id': phase.root_idea.id})

        mark_changed()

    with context.begin_transaction():
        op.drop_column('discussion_phase', 'root_idea_id')
