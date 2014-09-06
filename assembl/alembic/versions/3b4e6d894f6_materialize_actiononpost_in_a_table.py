"""Materialize ActionOnPost in a table

Revision ID: 3b4e6d894f6
Revises: f73cb874d53
Create Date: 2014-09-06 10:01:49.921434

"""

# revision identifiers, used by Alembic.
revision = '3b4e6d894f6'
down_revision = 'f73cb874d53'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config

post_tables = {
    'action_view_post': 'version:ReadStatusChange',
    'action_expand_post': 'version:ExpandPost',
    'action_collapse_post': 'version:CollapsePost'}


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'action_on_post',
            sa.Column(
                'id', sa.Integer,
                sa.ForeignKey('action.id', ondelete="CASCADE", onupdate='CASCADE'),
                primary_key=True),
            sa.Column(
                'post_id', sa.Integer,
                sa.ForeignKey('content.id', ondelete="CASCADE", onupdate='CASCADE'),
                nullable=False))
        # Alchemy put the post_id from the abstract class on the superclass... wtf?
        op.execute('''INSERT INTO action_on_post (id, post_id)
            SELECT id, post_id FROM action''')
        op.drop_column('action', 'post_id')
        for name in post_tables.keys():
            op.drop_table(name)


def downgrade(pyramid_env):
    with context.begin_transaction():
        for table_name, type_name in post_tables.items():
            op.create_table(
                table_name,
                sa.Column(
                    'id', sa.Integer,
                    sa.ForeignKey('action.id', ondelete="CASCADE", onupdate='CASCADE'),
                    primary_key=True))
            op.execute('''INSERT INTO %s (id)
                SELECT id FROM action WHERE "type" = '%s' ''' % (table_name, type_name))
        op.add_column('action', sa.Column(
                'post_id', sa.Integer,
                sa.ForeignKey('content.id', ondelete="CASCADE", onupdate='CASCADE')))
        op.execute('''UPDATE action SET post_id = (
            SELECT post_id FROM action_on_post WHERE action.id = action_on_post.id)''')
        op.drop_table('action_on_post')
