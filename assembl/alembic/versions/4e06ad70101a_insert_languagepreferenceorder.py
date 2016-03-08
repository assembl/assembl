"""Insert LanguagePreferenceOrder

Revision ID: 4e06ad70101a
Revises: 4f43341f787e
Create Date: 2016-03-08 08:46:55.859966

"""

# revision identifiers, used by Alembic.
revision = '4e06ad70101a'
down_revision = '4f43341f787e'

from alembic import context, op


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("""UPDATE user_language_preference
            SET source_of_evidence = source_of_evidence + 1
            WHERE source_of_evidence > 2""")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("""UPDATE user_language_preference
            SET source_of_evidence = source_of_evidence - 1
            WHERE source_of_evidence > 3""")
