"""file_upload

Revision ID: 1e01b5f0e5f9
Revises: 13cb36c87aea
Create Date: 2016-03-23 16:46:15.309571

"""

# revision identifiers, used by Alembic.
revision = '1e01b5f0e5f9'
down_revision = '13cb36c87aea'

from datetime import datetime
from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib.sqla_types import URLString
from assembl.lib.sqla_types import CoerceUnicode
from assembl.lib import config
from assembl.lib.sqla import using_virtuoso


def upgrade(pyramid_env):
    if using_virtuoso():
        with context.begin_transaction():
            # Add the type column to Document

            op.create_table(
                'tmp_document',
                sa.Column('id', sa.Integer, primary_key=True),
                sa.Column('uri_id', URLString(1024)),
                sa.Column('creation_date',
                          sa.DateTime,
                          nullable=False,
                          default=datetime.utcnow),
                sa.Column('discussion_id',
                    sa.Integer,
                    sa.ForeignKey(
                      'discussion.id',
                       ondelete="CASCADE",
                       onupdate="CASCADE"), nullable=False, index=False,),
                sa.Column('oembed_type', sa.String(1024), server_default=""),
                sa.Column('mime_type', sa.String(1024), server_default=""),
                sa.Column('title', sa.Unicode(), server_default=""),
                sa.Column('description', sa.UnicodeText),
                sa.Column('author_name', sa.Unicode()),
                sa.Column('author_url', URLString()),
                sa.Column('thumbnail_url', URLString()),
                sa.Column('site_name', sa.Unicode()),
                sa.Column('type', sa.String(100))
                )

            op.execute("""INSERT INTO tmp_document (id, uri_id, creation_date,
                       discussion_id, oembed_type, mime_type, title, description,
                       author_name, author_url, thumbnail_url, site_name, "type")
                       SELECT id, uri_id, creation_date, discussion_id,
                       oembed_type, mime_type, title, description, author_name,
                       author_url, thumbnail_url, site_name, 'document' from document""")

            op.drop_constraint("attachment_document_document_id_id", "attachment")

        with context.begin_transaction():
            op.execute("DELETE from document")

        with context.begin_transaction():

            op.add_column('document', sa.Column('type', sa.String(60),
                          nullable=False))

        with context.begin_transaction():

            op.execute("""INSERT INTO document (id, uri_id, creation_date,
                       discussion_id, oembed_type, mime_type, title, description,
                       author_name, author_url, thumbnail_url, site_name, "type")
                       SELECT id, uri_id, creation_date, discussion_id,
                       oembed_type, mime_type, title, description, author_name,
                       author_url, thumbnail_url, site_name, "type"
                       FROM tmp_document""")

        with context.begin_transaction():

            op.drop_table('tmp_document')

            op.execute(
                """ALTER TABLE "{schema}"."{user}"."attachment"
                   ADD CONSTRAINT "attachment_document_document_id_id"
                   FOREIGN KEY ("document_id")
                   REFERENCES "{schema}"."{user}"."document" ("id")
                   ON UPDATE CASCADE ON DELETE CASCADE""".format(
                      schema=config.get('db_schema'), user=config.get('db_user')))
    else:
        with context.begin_transaction():
            op.add_column(
                "document",
                sa.Column('type', sa.String(60)),
                config.get("db_schema"))
            op.execute("""UPDATE document SET "type"='document'""")
            op.alter_column("document", "type", nullable=False)

    with context.begin_transaction():
        op.create_table(
            'file',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                      'document.id', onupdate='CASCADE',
                      ondelete='CASCADE'), primary_key=True),
            sa.Column('data', sa.LargeBinary, nullable=False)
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('file')
        op.drop_column('document', 'type')
