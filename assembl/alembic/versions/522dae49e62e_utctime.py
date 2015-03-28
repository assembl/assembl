"""utctime

Revision ID: 522dae49e62e
Revises: 599eb2e48439
Create Date: 2015-03-28 09:48:54.369502

"""

# revision identifiers, used by Alembic.
revision = '522dae49e62e'
down_revision = '599eb2e48439'

from alembic import context
import transaction
from datetime import datetime
import pytz

from assembl.lib import config

local = pytz.timezone("America/Montreal")
ISO_8601_FORMAT = '%Y-%m-%dT%H:%M:%S'

def to_utc(dt):
    return local.localize(dt).astimezone(pytz.utc)

def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for u in db.query(m.User).all():
            u.creation_date = to_utc(u.creation_date).replace(tzinfo=None)
            if u.last_login:
                u.last_login = to_utc(u.last_login).replace(tzinfo=None)
        for w in db.query(m.CreativitySessionWidget).all():
            settings = w.settings_json
            change = False
            for notification in settings.get('notifications', []):
                try:
                    start = datetime.strptime(
                        notification['start'], ISO_8601_FORMAT)
                    notification['start'] = datetime.strftime(
                        to_utc(start), ISO_8601_FORMAT)
                    change = True
                    end = notification.get('end', None)
                    if end:
                        end = datetime.strptime(end, ISO_8601_FORMAT)
                        notification['end'] = datetime.strftime(
                            to_utc(end), ISO_8601_FORMAT)
                except (ValueError, TypeError, KeyError):
                    pass
            if change:
                w.settings_json = settings


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
