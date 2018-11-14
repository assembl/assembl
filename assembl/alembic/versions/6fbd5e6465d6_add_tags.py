"""add_tags

Revision ID: 6fbd5e6465d6
Revises: f8a3ebc5d6dd
Create Date: 2018-11-14 14:56:56.168710

"""

# revision identifiers, used by Alembic.
revision = '6fbd5e6465d6'
down_revision = 'f8a3ebc5d6dd'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
    	op.create_table(
            'tag',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('value', sa.UnicodeText, unique=True))
        op.create_table(
            'tags_association',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('tag_id', sa.Integer, sa.ForeignKey('tag.id'), nullable=False,))
        op.create_table(
            'extracts_tags_association',
            sa.Column('id',
                      sa.Integer,
                      sa.ForeignKey(
                            'tags_association.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                      primary_key=True),
            sa.Column('extract_id', sa.Integer, sa.ForeignKey('extract.id'), nullable=False,))

def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('extracts_tags_association')
        op.drop_table('tags_association')
        op.drop_table('tag')
