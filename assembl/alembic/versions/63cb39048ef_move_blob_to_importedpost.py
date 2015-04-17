"""move blob to importedPost

Revision ID: 63cb39048ef
Revises: fcf4b698a8a
Create Date: 2015-04-17 12:16:25.051387

"""

# revision identifiers, used by Alembic.
revision = '63cb39048ef'
down_revision = 'fcf4b698a8a'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('imported_post', sa.Column('imported_blob', sa.Binary))
        op.execute(
            """UPDATE imported_post SET imported_blob=(
                    SELECT email.full_message FROM email
                    WHERE email.id = imported_post.id
                    )
            """)
        op.drop_column('email', 'full_message')

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('email', sa.Column('full_message', sa.Binary))
        op.execute(
            """UPDATE email SET full_message=(
                SELECT imported_post.imported_blob from imported_post
                WHERE imported_post.id = email.id
            )"""
        )
        op.drop_column('imported_post', 'imported_blob')
