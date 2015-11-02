"""Uniqueness must be conjoint with discussion

Revision ID: e2b03a727fd
Revises: 456ac0bc450b
Create Date: 2015-11-02 17:09:11.077654

"""

# revision identifiers, used by Alembic.
revision = 'e2b03a727fd'
down_revision = '456ac0bc450b'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        try:
            op.drop_index('ix_document_uri_id', 'document')
        except:
            try:
                op.drop_index('ix_%s_%s_document_uri_id' % (
                    config.get('db_schema'), config.get('db_user')),
                    'document')
            except:
                pass

        op.execute(
            "CREATE UNIQUE INDEX ix_document_discussion_id_uri_id ON %s.%s.document (discussion_id, uri_id)" % (
                config.get('db_schema'), config.get('db_user')))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_index('ix_document_discussion_id_uri_id', 'document')
        op.execute(
            "CREATE UNIQUE INDEX ix_document_uri_id ON %s.%s.document (uri_id)" % (
                config.get('db_schema'), config.get('db_user')))
