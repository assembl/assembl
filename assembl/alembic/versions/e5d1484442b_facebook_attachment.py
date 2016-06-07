"""facebook_attachment

Revision ID: e5d1484442b
Revises: 2e4ce0e3a0b2
Create Date: 2015-10-07 23:18:04.639049

"""

# revision identifiers, used by Alembic.
revision = 'e5d1484442b'
down_revision = '2e4ce0e3a0b2'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('facebook_post', 'post_type')
        op.drop_column('facebook_post', 'link_name')
        # Could also alter column, but this operation has limitations
        # (which we won't hit)
        op.drop_column('facebook_post', 'attachment')
        op.add_column('facebook_post', sa.Column('attachment_blob', sa.Binary))
        op.add_column('facebook_source', sa.Column('lower_bound', sa.DateTime))
        op.add_column('facebook_source', sa.Column('upper_bound', sa.DateTime))

        # Do stuff with the app's models here.
        from assembl import models as m
        db = m.get_session_maker()()
        with transaction.manager:
            # Also correct the spelling mistake in attachment model.
            a = m.Attachment.__table__
            db.execute(
                a.update().where(a.c.attachmentPurpose == op.inline_literal(
                                 'EMBEEDED_ATTACHMENT')).
                values(attachmentPurpose=op.inline_literal("EMBED_ATTACHMENT"))
            )


def downgrade(pyramid_env):
    with context.begin_transaction():
        from assembl import models as m
        db = m.get_session_maker()()
        with transaction.manager:
            # Undo correcting of the spelling mistake in attachment model.
            a = m.Attachment.__table__
            db.execute(
                a.update().where(a.c.attachmentPurpose == op.inline_literal(
                                 'EMBED_ATTACHMENT')).
                values(attachmentPurpose=op.inline_literal(
                       "EMBEEDED_ATTACHMENT"))
            )

        op.drop_column('facebook_source', 'upper_bound')
        op.drop_column('facebook_source', 'lower_bound')
        op.drop_column('facebook_post', 'attachment_blob')
        op.add_column('facebook_post', sa.Column('post_type', sa.String(20)))
        op.add_column('facebook_post', sa.Column('link_name',
                      sa.Unicode(1024)))
        op.add_column('facebook_post', sa.Column('attachment',
                      sa.String(1024)))
