"""add_extract_hash

Revision ID: 180022eb0f0d
Revises: 8d37745a8e69
Create Date: 2018-08-09 23:18:03.815496

"""

# revision identifiers, used by Alembic.
revision = '180022eb0f0d'
down_revision = '8d37745a8e69'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'extract',
            sa.Column(
                'extract_hash', sa.String,
                nullable=False, server_default=''))

    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        model = m.Extract
        query = db.query(model)
        for extract in query:
            extract.update_extract_hash()


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('extract', 'extract_hash')
