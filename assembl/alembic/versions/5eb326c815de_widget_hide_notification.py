"""widget.hide_notification

Revision ID: 5eb326c815de
Revises: 06a588c53002
Create Date: 2016-07-08 13:10:05.164894

"""

# revision identifiers, used by Alembic.
revision = '5eb326c815de'
down_revision = '06a588c53002'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'widget',
            sa.Column('hide_notification', sa.Boolean, server_default='false'))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for widget in db.query(m.Widget).all():
            if widget.settings_json.get('show_infobar', None) is False:
                widget.hide_notification = True


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('widget', 'hide_notification')
