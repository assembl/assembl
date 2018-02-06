"""extract taxonomies

Revision ID: 95750e0267d8
Revises: ae1da08a88b0
Create Date: 2018-02-06 09:06:58.932766

"""

# revision identifiers, used by Alembic.
revision = '95750e0267d8'
down_revision = 'ae1da08a88b0'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        m.ExtractNatureVocabulary.pg_enum.create(db.bind)
        m.ExtractActionVocabulary.pg_enum.create(db.bind)
    with context.begin_transaction():
        op.create_table(
            "extract_nature",
            sa.Column('id', m.ExtractNatureVocabulary.pg_enum, primary_key=True),
            sa.Column("name_id", sa.Integer, sa.ForeignKey('langstring.id')))
        op.create_table(
            "extract_action",
            sa.Column('id', m.ExtractActionVocabulary.pg_enum, primary_key=True),
            sa.Column("name_id", sa.Integer, sa.ForeignKey('langstring.id')))
        op.add_column("extract", sa.Column(
            'extract_nature', m.ExtractNatureVocabulary.pg_enum,
            sa.ForeignKey("extract_nature.id")))
        op.add_column("extract", sa.Column(
            'extract_action', m.ExtractActionVocabulary.pg_enum,
            sa.ForeignKey("extract_action.id")))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('extract', 'extract_nature')
        op.drop_column('extract', 'extract_action')
        op.drop_table('extract_nature')
        op.drop_table('extract_action')
        op.execute('DROP TYPE extract_nature_type')
        op.execute('DROP TYPE extract_action_type')
