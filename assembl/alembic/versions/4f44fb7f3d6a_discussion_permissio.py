"""Discussion permissions

Revision ID: 4f44fb7f3d6a
Revises: 35de09f6083c
Create Date: 2013-08-29 17:28:35.059903

"""

# revision identifiers, used by Alembic.
revision = '4f44fb7f3d6a'
down_revision = '35de09f6083c'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.auth.models import (populate_default_roles,
    populate_default_permissions, create_default_permissions)
from assembl.lib.sqla import Base as SQLAlchemyBaseModel

db = m.DBSession


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'permission',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('name', sa.String(20), nullable=False))
        op.create_table(
            'discussion_permission',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column(
                'discussion_id',  sa.Integer,
                sa.ForeignKey('discussion.id', ondelete='CASCADE')),
            sa.Column(
                'role_id',  sa.Integer,
                sa.ForeignKey('role.id', ondelete='CASCADE')),
            sa.Column(
                'permission_id',  sa.Integer,
                sa.ForeignKey('permission.id', ondelete='CASCADE')))

    # Do stuff with the app's models here.
    SQLAlchemyBaseModel.metadata.bind = op.get_bind()
    with transaction.manager:
        populate_default_roles(db)
        populate_default_permissions(db)
        for d in db.query(m.Discussion).all():
            create_default_permissions(db, d)



def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('discussion_permission')
        op.drop_table('permission')
