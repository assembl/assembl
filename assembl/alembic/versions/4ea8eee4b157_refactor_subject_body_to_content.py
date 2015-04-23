"""refactor subject/body to Content

Revision ID: 4ea8eee4b157
Revises: 63cb39048ef
Create Date: 2015-04-21 17:11:31.989307

"""

# revision identifiers, used by Alembic.
revision = '4ea8eee4b157'
down_revision = '63cb39048ef'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('content', sa.Column('subject', sa.Unicode))
        op.add_column('content', sa.Column('body', sa.UnicodeText))
        op.execute(
            """UPDATE content SET subject = (
                    SELECT subject FROM post
                    WHERE post.id = content.id
                    )
            """)
        op.execute(
            """UPDATE content SET body = (
                    SELECT body FROM post
                    WHERE post.id = content.id
                    )
            """)
        op.drop_column('post', 'subject')
        op.drop_column('post', 'body')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('post', sa.Column('subject', sa.Unicode))
        op.add_column('post', sa.Column('body', sa.UnicodeText, nullable=False))
        op.execute(
            """UPDATE post SET subject = (
                    SELECT subject FROM content
                    WHERE post.id = content.id
                    )
            """)
        op.execute(
            """UPDATE post SET body = (
                    SELECT body FROM content
                    WHERE post.id = content.id
                    )
            """)
        op.drop_column('content', 'subject')
        op.drop_column('content', 'body')

