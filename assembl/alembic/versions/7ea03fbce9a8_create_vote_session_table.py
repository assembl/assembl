from alembic import context, op
import sqlalchemy as sa

"""create vote_session table

Revision ID: 7ea03fbce9a8
Revises: c3f8bc9c75d5
Create Date: 2017-12-22 13:28:30.634303

"""

# revision identifiers, used by Alembic.
revision = '7ea03fbce9a8'
down_revision = 'c3f8bc9c75d5'


def LangStringId(column_name):
    return sa.Column(
        column_name + '_id',
        sa.Integer(),
        sa.ForeignKey('langstring.id')
    )


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'vote_session',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column(
                'discussion_id',
                sa.Integer,
                sa.ForeignKey(
                    'discussion.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"
                ),
                nullable=False,
                index=False
            ),
            LangStringId('title'),
            LangStringId('subtitle'),
            LangStringId('instructions_section_title'),
            LangStringId('propositions_section_title'),
            sa.schema.UniqueConstraint(
                "title_id",
                "subtitle_id",
                "instructions_section_title_id",
                "propositions_section_title_id",
            )
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('vote_session')
