"""widgets table

Revision ID: 12fd3dd74340
Revises: 2e842a54ff2
Create Date: 2014-04-18 08:18:24.786583

"""

# revision identifiers, used by Alembic.
revision = '12fd3dd74340'
down_revision = '2e842a54ff2'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'widget',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('widget_type', sa.String(120), nullable=False),
            sa.Column('settings', sa.Text),
            sa.Column('discussion_id', sa.Integer,
                      sa.ForeignKey('discussion.id', ondelete="CASCADE",
                                    onupdate="CASCADE"),
                      nullable=False),
            sa.Column('main_idea_view_id', sa.Integer,
                      sa.ForeignKey('idea_graph_view.id', ondelete="CASCADE",
                                    onupdate="CASCADE"),
                      nullable=True))
        op.create_table(
            'widget_user_config',
            sa.Column('widget_id', sa.Integer,
                      sa.ForeignKey('widget.id',
                                    ondelete="CASCADE", onupdate="CASCADE"),
                      nullable=False),
            sa.Column('user_id', sa.Integer,
                      sa.ForeignKey('user.id', ondelete="CASCADE",
                                    onupdate="CASCADE"),
                      nullable=False),
            sa.Column('settings', sa.Text))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('widget_user_config')
        op.drop_table('widget')
