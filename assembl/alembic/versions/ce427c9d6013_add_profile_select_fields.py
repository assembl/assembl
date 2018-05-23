"""Add profile select fields

Revision ID: ce427c9d6013
Revises: 42219c2029ba
Create Date: 2018-05-22 10:18:17.093091

"""

# revision identifiers, used by Alembic.
revision = 'ce427c9d6013'
down_revision = '42219c2029ba'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'select_field',
            sa.Column(
                "id", sa.Integer,
                sa.ForeignKey("configurable_field.id", ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True),
            sa.Column(
                "multivalued", sa.Boolean)
        )
        op.create_table(
            'select_field_option',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('order', sa.Float, nullable=False),
            sa.Column('label_id', sa.Integer, sa.ForeignKey('langstring.id'), nullable=False, index=True),
            sa.Column(
                'select_field_id',
                sa.Integer,
                sa.ForeignKey('select_field.id', ondelete='CASCADE', onupdate='CASCADE'),
                nullable=False, index=True)
        )
        op.drop_constraint(u'text_field_id_fkey', 'text_field', type_='foreignkey')
        op.create_foreign_key(None, 'text_field', 'configurable_field', ['id'], ['id'], ondelete='CASCADE', onupdate='CASCADE')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('select_field_option')
        op.drop_table('select_field')
