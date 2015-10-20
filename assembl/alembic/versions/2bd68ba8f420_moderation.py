"""Moderation

Revision ID: 2bd68ba8f420
Revises: 28ff27fa61a9
Create Date: 2015-10-20 13:54:14.813997

"""

# revision identifiers, used by Alembic.
revision = '2bd68ba8f420'
down_revision = '28ff27fa61a9'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        from assembl.models.post import PublicationStates
        schema = config.get('db_schema')+"."+config.get('db_user')
        op.add_column("post", sa.Column(
            "publication_state", PublicationStates.db_type(),
            nullable=False, server_default=PublicationStates.PUBLISHED.name),
            schema=schema)
        op.add_column("post", sa.Column(
            "moderator_id", sa.Integer, sa.ForeignKey(
                'user.id', ondelete='SET NULL', onupdate='CASCADE'),
            nullable=True,))
        op.add_column("post", sa.Column(
            "moderated_on", sa.DateTime))
        op.add_column("post", sa.Column(
            "moderation_text", sa.UnicodeText))
        op.add_column("post", sa.Column(
            "moderator_comment", sa.UnicodeText))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column("post", "publication_state")
        op.drop_column("post", "moderator_id")
        op.drop_column("post", "moderated_on")
        op.drop_column("post", "moderation_text")
        op.drop_column("post", "moderator_comment")
