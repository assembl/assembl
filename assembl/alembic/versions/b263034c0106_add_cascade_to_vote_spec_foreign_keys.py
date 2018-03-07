"""add_cascade_to_vote_spec_foreign_keys

Revision ID: b263034c0106
Revises: 614b81a60bcb
Create Date: 2018-03-07 11:02:27.555087

"""

# revision identifiers, used by Alembic.
revision = 'b263034c0106'
down_revision = '614b81a60bcb'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with context.begin_transaction():
        op.drop_constraint(u'token_vote_specification_id_fkey', 'token_vote_specification', type_='foreignkey')
        op.create_foreign_key(None, 'token_vote_specification', 'vote_specification', ['id'], ['id'], ondelete='CASCADE', onupdate='CASCADE')
        op.drop_constraint(u'number_gauge_vote_specification_id_fkey', 'number_gauge_vote_specification', type_='foreignkey')
        op.create_foreign_key(None, 'number_gauge_vote_specification', 'vote_specification', ['id'], ['id'], ondelete='CASCADE', onupdate='CASCADE')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(u'token_vote_specification_id_fkey', 'token_vote_specification', type_='foreignkey')
        op.create_foreign_key(None, 'token_vote_specification', 'vote_specification', ['id'], ['id'])
        op.drop_constraint(u'number_gauge_vote_specification_id_fkey', 'number_gauge_vote_specification', type_='foreignkey')
        op.create_foreign_key(None, 'number_gauge_vote_specification', 'vote_specification', ['id'], ['id'])
