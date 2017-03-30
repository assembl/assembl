"""add tables needed for phase 1

Revision ID: 14e5db4fde8e
Revises: f6b4dabfe49e
Create Date: 2017-03-13 14:56:03.378862

"""

# revision identifiers, used by Alembic.
revision = '14e5db4fde8e'
down_revision = 'f6b4dabfe49e'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'thematic',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                'idea.id'), primary_key=True),
            sa.Column('title_id', sa.Integer,
                sa.ForeignKey('langstring.id'), nullable=False),
            sa.Column('description_id', sa.Integer,
                sa.ForeignKey('langstring.id')),
            sa.Column('video_title_id', sa.Integer,
                sa.ForeignKey('langstring.id')),
            sa.Column('video_description_id', sa.Integer,
                sa.ForeignKey('langstring.id')),
            sa.Column('video_html_code', sa.UnicodeText),
            sa.Column('identifier', sa.String(60))
        )
        op.create_table(
            'question',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                'idea.id'), primary_key=True),
            sa.Column('title_id', sa.Integer,
                sa.ForeignKey('langstring.id'), nullable=False),
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('thematic')
        op.drop_table('question')
