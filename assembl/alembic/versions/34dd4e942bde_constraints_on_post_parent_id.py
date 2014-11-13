"""constraints on post.parent_id

Revision ID: 34dd4e942bde
Revises: 539588abd5e0
Create Date: 2014-11-12 20:49:42.944506

"""

# revision identifiers, used by Alembic.
revision = '34dd4e942bde'
down_revision = '539588abd5e0'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute('ALTER TABLE post DROP CONSTRAINT "post_post_parent_id_id"')
        op.execute('''
            ALTER TABLE "post"
              ADD CONSTRAINT "post_post_parent_id_id" FOREIGN KEY ("parent_id")
              REFERENCES "post" ("id") ON UPDATE CASCADE ON DELETE SET NULL''')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.execute('ALTER TABLE post DROP CONSTRAINT "post_post_parent_id_id"')
        op.execute('''
            ALTER TABLE "post"
              ADD CONSTRAINT "post_post_parent_id_id" FOREIGN KEY ("parent_id")
              REFERENCES "post" ("id")''')
