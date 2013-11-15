"""Switching the foreign key between Discussion and Synthesis

Revision ID: e02fc0d0e4e
Revises: 4b8f2bb753b2
Create Date: 2013-08-21 17:11:35.351948

"""

# revision identifiers, used by Alembic.
revision = 'e02fc0d0e4e'
down_revision = '4b8f2bb753b2'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'synthesis', 
            sa.Column(
                'discussion_id',
                sa.Integer(),
                sa.ForeignKey('discussion.id', ondelete="CASCADE"),
            )
        )

        op.execute("""
        UPDATE synthesis 
        SET discussion_id=(
          SELECT discussion.id as discussion_id
          FROM discussion 
          JOIN synthesis
          ON discussion.synthesis_id=synthesis.id
          WHERE discussion.synthesis_id=synthesis.id
        )
        """)

        op.alter_column('synthesis', 'discussion_id', nullable=False)
        op.drop_column('discussion', u'synthesis_id')

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('synthesis', 'discussion_id')
        op.add_column(
            'discussion',
            sa.Column(
                u'synthesis_id',
                sa.INTEGER(),
                sa.ForeignKey('synthesis.id'),
                nullable=True
            )
        )
