"""refactor subject/body to Content

Revision ID: 4ea8eee4b157
Revises: 33d7d4945aa3
Create Date: 2015-04-21 17:11:31.989307

"""

# revision identifiers, used by Alembic.
revision = '4ea8eee4b157'
down_revision = '33d7d4945aa3'

from alembic import context, op
import sqlalchemy as sa

#quadnames:col_pattern_Post_subject

def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('content', sa.Column('subject', sa.Unicode, server_default=""))
        op.add_column('content', sa.Column('body', sa.UnicodeText, server_default=""))
    with context.begin_transaction():
        op.execute(
            """UPDATE content SET subject = (
                    SELECT subject FROM post
                    WHERE post.id = content.id)
            """)
        op.execute(
            """UPDATE content SET body = (
                    SELECT body FROM post
                    WHERE post.id = content.id)
            """)
    from assembl.scripts.rebuild_tables import rebuild_table
    from assembl.models import Post
    # Thanks to https://github.com/openlink/virtuoso-opensource/issues/378
    # The aim is to remove the columns from the table; make sure they are not in the model when you migrate
    rebuild_table(Post.__table__, True)


def downgrade(pyramid_env):
    from assembl.models import Content
    assert not ('body' in Content.__table__.c or 'subject' in Content.__table__.c), \
        "Comment out the body and subject from Content to run the back migration"
    op.add_column('post', sa.Column('subject', sa.Unicode, server_default=""))
    op.add_column('post', sa.Column('body', sa.UnicodeText, server_default=""))
    with context.begin_transaction():
        op.execute(
            """UPDATE post SET subject = (
                    SELECT subject FROM content
                    WHERE post.id = content.id)
            """)
        op.execute(
            """UPDATE post SET body = (
                    SELECT body FROM content
                    WHERE content.id = post.id
                    AND content.body IS NOT NULL)
            """)
    from assembl.scripts.rebuild_tables import rebuild_table
    rebuild_table(Content.__table__, True)
