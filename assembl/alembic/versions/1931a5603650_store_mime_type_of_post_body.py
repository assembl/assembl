"""Store mime type of post body

Revision ID: 1931a5603650
Revises: 1593228f01ab
Create Date: 2014-06-30 15:55:08.568749

"""

# revision identifiers, used by Alembic.
revision = '1931a5603650'
down_revision = '1593228f01ab'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('imported_post', sa.Column('body_mime_type', sa.types.Unicode(), nullable=False))
        op.execute("""
UPDATE  imported_post
SET     body_mime_type = 'text/plain'
""")
        pass

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        #ALTER TABLE assembl..imported_post DROP COLUMN body_mime_type
        op.drop_column('imported_post', 'body_mime_type')
        pass
