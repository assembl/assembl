"""widget lifecycle

Revision ID: 3bfbb0ef1bd6
Revises: 19b28b9ea376
Create Date: 2015-07-06 17:42:10.833829

"""

# revision identifiers, used by Alembic.
revision = '3bfbb0ef1bd6'
down_revision = '19b28b9ea376'

from alembic import context, op
import sqlalchemy as sa
import transaction
import simplejson as json

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('widget',
            sa.Column('start_date', sa.DateTime, server_default=None))
        op.add_column('widget',
            sa.Column('end_date', sa.DateTime, server_default=None))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for (id, settings) in db.execute(
                "select id, settings from widget "
                "where type = 'creativity_session_widget'"):
            settings = json.loads(settings) if settings else {}
            if settings.get('startDate', None):
                db.execute("update widget set start_date = '%s' where id = %d" %(
                    settings['startDate'], id))
            if settings.get('endDate', None):
                db.execute("update widget set end_date = '%s' where id = %d" %(
                    settings['endDate'], id))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('widget', 'start_date')
        op.drop_column('widget', 'end_date')
