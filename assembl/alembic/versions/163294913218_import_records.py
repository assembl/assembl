"""import_records

Revision ID: 163294913218
Revises: 368a596ab4b5
Create Date: 2015-06-12 12:37:24.799176

"""

# revision identifiers, used by Alembic.
revision = '163294913218'
down_revision = '368a596ab4b5'

from datetime import datetime
from alembic import context, op
import sqlalchemy as sa

from assembl.lib import config


def upgrade(pyramid_env):
    from virtuoso.alchemy import IRI_ID
    with context.begin_transaction():
        op.create_table(
            'import_record',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('discussion_id', sa.Integer, sa.ForeignKey("discussion.id"), nullable=False),
            sa.Column('external_iri_id', IRI_ID, nullable=False),
            sa.Column('internal_iri_id', IRI_ID, nullable=False, index=True),
            sa.Column('server_iri_id', IRI_ID, nullable=False),
            sa.Column('last_modified', sa.DateTime, default=datetime.utcnow))
        op.create_unique_constraint(config.get('db_schema')+"_"+config.get('db_user')+"_import_record_UNQC_discussion_id_external_iri_id",
            "import_record", ["discussion_id","external_iri_id"])


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(config.get('db_schema')+"_"+config.get('db_user')+"_import_record_UNQC_discussion_id_external_iri_id",
            "import_record")
        op.drop_table('import_record')
