"""VoteSession now inherits from VotingWidget

Revision ID: 53af22ed84c1
Revises: 95750e0267d8
Create Date: 2018-02-13 16:14:51.222332

"""

# revision identifiers, used by Alembic.
revision = '53af22ed84c1'
down_revision = '95750e0267d8'

from alembic import context, op
from assembl.lib.sqla import mark_changed
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with context.begin_transaction():
        # temporary fix vote_session_id foreign key
        op.drop_constraint(u'vote_specification_vote_session_id_fkey', 'vote_specification', type_='foreignkey')
        op.create_foreign_key(None, 'vote_specification', 'vote_session', ['vote_session_id'], ['id'], ondelete='CASCADE', onupdate='CASCADE')

    with transaction.manager:
        # remove all existing vote sessions (there is no vote session currently in prod)
        db.execute('DELETE FROM vote_session')
        mark_changed()

    with context.begin_transaction():
        op.drop_column('vote_specification', 'vote_session_id')
        op.alter_column("vote_specification", "widget_id", nullable=False)


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'vote_specification',
            sa.Column(
                'vote_session_id',
                sa.Integer(),
                sa.ForeignKey('vote_session.id'), nullable=True, index=True))
        op.alter_column("vote_specification", "widget_id", nullable=True)
