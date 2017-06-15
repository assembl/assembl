"""Move title and description fields from thematic to idea

Revision ID: b0a17a1c42cb
Revises: 2b8cadc0af7e
Create Date: 2017-06-12 13:05:58.121094

"""

# revision identifiers, used by Alembic.
revision = 'b0a17a1c42cb'
down_revision = '2b8cadc0af7e'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'idea',
            sa.Column('title_id', sa.Integer,
                sa.ForeignKey('langstring.id')))
        op.add_column(
            'idea',
            sa.Column('description_id', sa.Integer,
                sa.ForeignKey('langstring.id')))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        db.execute("UPDATE idea SET title_id = (SELECT title_id FROM thematic WHERE id=idea.id) WHERE idea.sqla_type='thematic'")
        db.execute("UPDATE idea SET description_id = (SELECT description_id FROM thematic WHERE id=idea.id) WHERE idea.sqla_type='thematic'")
        db.execute("UPDATE idea SET title_id = (SELECT title_id FROM question WHERE id=idea.id) WHERE idea.sqla_type='question'")
        mark_changed()

    with context.begin_transaction():
        op.drop_column('question', 'title_id')
        op.drop_column('thematic', 'title_id')
        op.drop_column('thematic', 'description_id')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'thematic',
            sa.Column('title_id', sa.Integer,
                sa.ForeignKey('langstring.id')))
        op.add_column(
            'thematic',
            sa.Column('description_id', sa.Integer,
                sa.ForeignKey('langstring.id')))
        op.add_column(
            'question',
            sa.Column('title_id', sa.Integer,
                sa.ForeignKey('langstring.id')))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        db.execute("UPDATE thematic SET title_id = (SELECT title_id FROM idea WHERE id=thematic.id AND sqla_type='thematic')")
        db.execute("UPDATE thematic SET description_id = (SELECT description_id FROM idea WHERE id=thematic.id AND sqla_type='thematic')")
        db.execute("UPDATE question SET title_id = (SELECT title_id FROM idea WHERE id=question.id AND sqla_type='question')")
        mark_changed()

    with context.begin_transaction():
        op.drop_column('idea', 'title_id')
        op.drop_column('idea', 'description_id')
