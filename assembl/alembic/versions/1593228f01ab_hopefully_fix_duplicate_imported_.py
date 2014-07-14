"""Hopefully fix duplicate imported messages in the databse one last time...

Revision ID: 1593228f01ab
Revises: 36f403b0097d
Create Date: 2014-06-23 15:36:27.784319

"""

# revision identifiers, used by Alembic.
revision = '1593228f01ab'
down_revision = '36f403b0097d'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("""
UPDATE  post p
SET     parent_id = COALESCE(
    (
        SELECT new_post_parent.id AS new_post_parent_id
        FROM post AS post_to_correct
        JOIN post AS bad_post_parent ON (post_to_correct.parent_id = bad_post_parent.id)
        JOIN post AS new_post_parent ON (new_post_parent.message_id = bad_post_parent.message_id AND new_post_parent.id <> bad_post_parent.id)
        WHERE post_to_correct.parent_id IN (
          SELECT MAX(post.id) as max_post_id 
          FROM imported_post 
          JOIN post ON (post.id=imported_post.id) 
          GROUP BY message_id, source_id
          HAVING COUNT(post.id)>1
          )
        AND p.id = post_to_correct.id
    ),
    p.parent_id
)
        """)
        op.execute("""
DELETE FROM post
WHERE post.id IN (
    SELECT MAX(post.id) as max_post_id 
    FROM imported_post 
    JOIN post ON (post.id=imported_post.id) 
    GROUP BY message_id, source_id 
    HAVING COUNT(post.id)>1
)
        """)
        op.add_column(
            'imported_post', sa.Column(
                'source_post_id',
                sa.Unicode(),
                nullable=False,
                index=True,
                )
            )
        op.execute("""
UPDATE  imported_post p
SET     source_post_id = (
SELECT message_id
FROM post
WHERE p.id = post.id
)
        """)
        op.create_unique_constraint(config.get('db_schema')+"_"+config.get('db_user')+"_imported_post_UNQC_source_post_id_source_id", "imported_post", ["source_post_id","source_id"])
        pass

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
