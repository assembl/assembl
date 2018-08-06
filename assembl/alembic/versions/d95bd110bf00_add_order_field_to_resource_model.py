"""Add order field to Resource model

Revision ID: d95bd110bf00
Revises: 134299d407b9
Create Date: 2018-07-30 12:01:54.228306

"""

# revision identifiers, used by Alembic.
revision = 'd95bd110bf00'
down_revision = '134299d407b9'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    with context.begin_transaction():
        op.add_column(
            'resource',
            sa.Column('order', sa.Float, nullable=False, default=0.0, server_default='0'))

    db = m.get_session_maker()()
    with transaction.manager:
        for discussion_id in db.query(m.Discussion.id):
            # order by id to always return resources in the order in which they have been created
            resources = db.query(m.Resource).filter(
                m.Resource.discussion_id == discussion_id).order_by(
                    m.Resource.id)
            for idx, resource in enumerate(resources):
                resource.order = idx + 1


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('resource', 'order')
