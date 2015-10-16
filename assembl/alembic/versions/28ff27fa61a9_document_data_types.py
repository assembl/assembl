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


old_types = {
    "uri_id": sa.Unicode,
    "oembed_type": sa.Unicode,
    "mime_type": sa.Unicode,
    "author_name": sa.UnicodeText,
    "author_url": sa.UnicodeText,
    "thumbnail_url": sa.UnicodeText,
    "site_name": sa.UnicodeText
}

new_types = {
    "uri_id": sa.String,
    "oembed_type": sa.String,
    "mime_type": sa.String,
    "author_name": sa.Unicode,
    "author_url": sa.String,
    "thumbnail_url": sa.String,
    "site_name": sa.Unicode
}


with_default = {"uri_id", "oembed_type", "mime_type"}


def upgrade(pyramid_env):
    with context.begin_transaction():
        for f, stype in new_types.iteritems():
            op.add_column(
                'document', sa.Column(f+'_temp', stype))

        op.execute("UPDATE document SET " + ", ".join((
            ("{f}_temp = cast({f} as varchar)"
                if stype == sa.String else
                "{f}_temp = {f}").format(f=f)
            for (f, stype) in new_types.iteritems())))
        mark_changed()
    # Why do two variants exist???
    try:
        op.drop_index('ix_document_uri_id', 'document')
    except:
        try:
            op.drop_index('ix_%s_%s_document_uri_id' % (
                config.get('db_schema'), config.get('db_user')),
                'document')
        except:
            pass

    with context.begin_transaction():
        for f in new_types:
            op.drop_column('document', f)
        for f, stype in new_types.iteritems():
            op.add_column('document', sa.Column(
                f, stype,
                server_default="" if f in with_default else None))
        op.execute("UPDATE document SET " + ",".join((
            "{f} = {f}_temp".format(f=f)
            for f in new_types)))
        mark_changed()

    with context.begin_transaction():
        op.execute(
            "CREATE UNIQUE INDEX ix_document_uri_id ON %s.%s.document (uri_id)" % (
                config.get('db_schema'), config.get('db_user')))
        for f in new_types:
            op.drop_column('document', f+"_temp")


def downgrade(pyramid_env):
    with context.begin_transaction():
        for f, stype in old_types.iteritems():
            op.add_column(
                'document', sa.Column(f+'_temp', stype))
        op.execute("UPDATE document SET " + ",".join((
            "{f}_temp = {f}".format(f=f)
            for (f, stype) in old_types.iteritems())))
        mark_changed()
    # Why do two variants exist???
    try:
        op.drop_index('ix_document_uri_id', 'document')
    except:
        try:
            op.drop_index('ix_%s_%s_document_uri_id' % (
                config.get('db_schema'), config.get('db_user')),
                'document')
        except:
            pass
    with context.begin_transaction():
        for f in old_types:
            op.drop_column('document', f)
        for f, stype in old_types.iteritems():
            op.add_column('document', sa.Column(
                f, stype,
                server_default="" if f in with_default else None))
        op.execute("UPDATE document SET " + ",".join((
            "{f} = {f}_temp".format(f=f)
            for f in old_types)))
        mark_changed()

    with context.begin_transaction():
        op.execute(
            "CREATE UNIQUE INDEX ix_document_uri_id ON %s.%s.document (uri_id)" % (
                config.get('db_schema'), config.get('db_user')))
        for f in old_types:
            op.drop_column('document', f+"_temp")
