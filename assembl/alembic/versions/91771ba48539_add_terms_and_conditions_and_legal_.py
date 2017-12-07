"""add_terms_and_conditions_and_legal_notice

Revision ID: 91771ba48539
Revises: ca1c445a2e24
Create Date: 2017-11-27 11:56:49.216010

"""
from alembic import context, op
import sqlalchemy as sa
import transaction


# revision identifiers, used by Alembic.
revision = '91771ba48539'
down_revision = 'ca1c445a2e24'


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    with transaction.manager:
        op.add_column(
            'discussion', sa.Column('terms_and_conditions_id', sa.Integer(), sa.ForeignKey('langstring.id')))
        op.add_column(
            'discussion', sa.Column('legal_notice_id', sa.Integer(), sa.ForeignKey('langstring.id')))

        sa.schema.UniqueConstraint(
            "terms_and_conditions_id", "legal_notice_id")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'terms_and_conditions_id')
        op.drop_column('discussion', 'legal_notice_id')
