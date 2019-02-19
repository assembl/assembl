"""Add semantic analysis to section type

Revision ID: 4f529b59026b
Revises: 243942b0a23d
Create Date: 2019-01-17 16:47:22.932933

"""

# revision identifiers, used by Alembic.
revision = '4f529b59026b'
down_revision = '243942b0a23d'

def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    # To run an `ALTER TYPE` query, we need to set the db connection isolation level to 0
    # in order to let PostgreSQL to commit the query instead of SQLAlchemy
    # ISOLATION_LEVEL_AUTOCOMMIT     = 0
    # ISOLATION_LEVEL_READ_COMMITTED = 1 // Default value
    # ISOLATION_LEVEL_SERIALIZABLE   = 2
    db.connection().connection.set_isolation_level(0)
    db.execute("ALTER TYPE section_types ADD VALUE IF NOT EXISTS 'SEMANTIC_ANALYSIS'")
    db.connection().connection.set_isolation_level(1)

# No downgrade function defined (checked with Aryan) in order to avoid references conflict
# when deleting an enum type in PostgreSQL 9.6
def downgrade(pyramid_env):
    pass