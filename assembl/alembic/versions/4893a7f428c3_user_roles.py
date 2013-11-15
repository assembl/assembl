"""user roles

Revision ID: 4893a7f428c3
Revises: 1d136380561f
Create Date: 2013-08-08 20:24:59.159648

"""

# revision identifiers, used by Alembic.
revision = '4893a7f428c3'
down_revision = '1d136380561f'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    from assembl.auth.models import Role
    with context.begin_transaction():
        op.create_table('role',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.String(20), nullable=False))

        op.create_table('user_role',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('user_id', sa.Integer,
                      sa.ForeignKey('user.id', ondelete='CASCADE'),
                      index=True),
            sa.Column('role_id', sa.Integer,
                      sa.ForeignKey('role.id', ondelete='CASCADE')))

        op.create_table('local_user_role',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('user_id', sa.Integer,
                      sa.ForeignKey('user.id', ondelete='CASCADE')),
            sa.Column('discussion_id', sa.Integer,
                      sa.ForeignKey('discussion.id', ondelete='CASCADE')),
            sa.Column('role_id', sa.Integer,
                      sa.ForeignKey('role.id', ondelete='CASCADE')))
        op.create_index('user_discussion_idx',
                        'local_user_role', ['user_id', 'discussion_id'])
        db = Role.db()
        db.add(Role(name='r:admin'))
        db.add(Role(name='r:moderator'))
        db.add(Role(name='r:catcher'))
        db.add(Role(name='r:participant'))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('user_role')
        op.drop_index('user_discussion_idx')
        op.drop_table('local_user_role')
        op.drop_table('role')
