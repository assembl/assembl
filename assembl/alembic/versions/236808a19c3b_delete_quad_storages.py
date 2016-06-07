"""delete quad storages

Revision ID: 236808a19c3b
Revises: 5a0ce18bf2b2
Create Date: 2015-01-09 10:35:14.910892

"""

# revision identifiers, used by Alembic.
revision = '236808a19c3b'
down_revision = '5a0ce18bf2b2'

from alembic import context


def upgrade(pyramid_env):
    from assembl.semantic.virtuoso_mapping import AssemblQuadStorageManager
    with context.begin_transaction():
        aqsm = AssemblQuadStorageManager()
        aqsm.drop_all_discussion_storages_but(-1)


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
