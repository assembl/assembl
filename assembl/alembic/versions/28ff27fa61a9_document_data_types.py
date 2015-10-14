"""Document data types

Revision ID: 28ff27fa61a9
Revises: 46d8492ca1c4
Create Date: 2015-10-14 11:22:18.508238

"""

# revision identifiers, used by Alembic.
revision = '28ff27fa61a9'
down_revision = '46d8492ca1c4'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed

fields = ('id', 'uri_id', 'creation_date', 'discussion_id', 'oembed_type',
          'mime_type', 'title', 'description', 'author_name', 'author_url',
          'thumbnail_url', 'site_name')

ascii_fields = {
    'uri_id', 'oembed_type', 'mime_type', 'author_url', 'thumbnail_url'}

field_names = ', '.join(fields)

cast_fields = ', '.join([
    'cast(%s as varchar)' % (f) if f in ascii_fields else f for f in fields])

ctx = {
    'schema': config.get('db_schema'),
    'user': config.get('db_user')
}

def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'document_temp',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('uri_id', sa.String(1024), server_default="",
                      unique=True, index=True),
            sa.Column('creation_date',
                      sa.DateTime,
                      nullable=False),
            sa.Column('discussion_id',
                      sa.Integer,
                      sa.ForeignKey(
                          'discussion.id',
                          ondelete="CASCADE",
                          onupdate="CASCADE"),
                      nullable=False, index=False),
            sa.Column('oembed_type', sa.String(1024), server_default=""),
            sa.Column('mime_type', sa.String(1024), server_default=""),
            sa.Column('title', sa.Unicode(1024), server_default=""),
            sa.Column('description', sa.UnicodeText),
            sa.Column('author_name', sa.Unicode),
            sa.Column('author_url', sa.String),
            sa.Column('thumbnail_url', sa.String),
            sa.Column('site_name', sa.Unicode),
            )
        op.execute("insert into document_temp (%s) select %s from document" % (
            field_names, cast_fields))
        mark_changed()
    with context.begin_transaction():
        op.drop_constraint("attachment_document_document_id_id", "attachment")
        op.drop_table('document')
        op.create_table(
            'document',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('uri_id', sa.String(1024), server_default="",
                      unique=True, index=True),
            sa.Column('creation_date',
                      sa.DateTime,
                      nullable=False),
            sa.Column('discussion_id',
                      sa.Integer,
                      sa.ForeignKey(
                          'discussion.id',
                          ondelete="CASCADE",
                          onupdate="CASCADE"),
                      nullable=False, index=False),
            sa.Column('oembed_type', sa.String(1024), server_default=""),
            sa.Column('mime_type', sa.String(1024), server_default=""),
            sa.Column('title', sa.Unicode(1024), server_default=""),
            sa.Column('description', sa.UnicodeText),
            sa.Column('author_name', sa.Unicode),
            sa.Column('author_url', sa.String),
            sa.Column('thumbnail_url', sa.String),
            sa.Column('site_name', sa.Unicode),
            )
        op.execute("insert into document (%s) select %s from document_temp" % (
            field_names, field_names))
        op.execute("""
            ALTER TABLE {schema}.{user}.attachment
            ADD CONSTRAINT attachment_document_document_id_id FOREIGN KEY (document_id)
            REFERENCES {schema}.{user}.document (id) ON UPDATE CASCADE ON DELETE CASCADE""".format(**ctx))
        op.drop_table("document_temp")
        mark_changed()


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'document_temp',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('uri_id', sa.Unicode(1024), server_default="", unique=False, index=True),
            sa.Column('creation_date',
                      sa.DateTime,
                      nullable=False),
            sa.Column('discussion_id',
                       sa.Integer,
                       sa.ForeignKey(
                            'discussion.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                nullable=False,
                index=False,),
            sa.Column('oembed_type', sa.Unicode(1024), server_default=""),
            sa.Column('mime_type', sa.Unicode(1024), server_default=""),
            sa.Column('title', sa.Unicode(1024), server_default=""),
            sa.Column('description', sa.UnicodeText),
            sa.Column('author_name', sa.UnicodeText),
            sa.Column('author_url', sa.UnicodeText),
            sa.Column('thumbnail_url', sa.UnicodeText),
            sa.Column('site_name', sa.UnicodeText))
        op.execute("insert into document_temp ({fnames}) select {fnames} from document".format(fnames=field_names))
        mark_changed()
    with context.begin_transaction():
        op.drop_constraint("attachment_document_document_id_id", "attachment")
        op.drop_table('document')
        op.create_table(
            'document',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('uri_id', sa.Unicode(1024), server_default="", unique=False, index=True),
            sa.Column('creation_date',
                      sa.DateTime,
                      nullable=False),
            sa.Column('discussion_id',
                       sa.Integer,
                       sa.ForeignKey(
                            'discussion.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                nullable=False,
                index=False,),
            sa.Column('oembed_type', sa.Unicode(1024), server_default=""),
            sa.Column('mime_type', sa.Unicode(1024), server_default=""),
            sa.Column('title', sa.Unicode(1024), server_default=""),
            sa.Column('description', sa.UnicodeText),
            sa.Column('author_name', sa.UnicodeText),
            sa.Column('author_url', sa.UnicodeText),
            sa.Column('thumbnail_url', sa.UnicodeText),
            sa.Column('site_name', sa.UnicodeText))
        
        op.execute("insert into document ({fnames}) select {fnames} from document_temp".format(fnames=field_names))
        op.execute("""
            ALTER TABLE {schema}.{user}.attachment
            ADD CONSTRAINT attachment_document_document_id_id FOREIGN KEY (document_id)
            REFERENCES {schema}.{user}.document (id) ON UPDATE CASCADE ON DELETE CASCADE""".format(**ctx))

        op.drop_table("document_temp")
        mark_changed()
