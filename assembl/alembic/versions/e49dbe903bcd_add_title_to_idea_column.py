"""add title to idea column

Revision ID: e49dbe903bcd
Revises: 053f788ca313
Create Date: 2017-11-14 16:10:58.813358

"""

# revision identifiers, used by Alembic.
revision = 'e49dbe903bcd'
down_revision = '053f788ca313'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    with context.begin_transaction():
        op.add_column('idea_message_column', sa.Column('title_id', sa.Integer, sa.ForeignKey(m.LangString.id), nullable=True))

    with transaction.manager:
        db = m.get_session_maker()()
        columns = db.query(m.IdeaMessageColumn).all()
        for column in columns:
            if column.title is None:
                column.title = column.name.clone()


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('idea_message_column', 'title_id')
