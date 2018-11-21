"""discussion_start_end_dates

Revision ID: d813ab110e00
Revises: c9623c879eb1
Create Date: 2018-11-21 17:34:20.946744

"""

# revision identifiers, used by Alembic.
revision = 'd813ab110e00'
down_revision = 'c9623c879eb1'

from alembic import context, op
import sqlalchemy as sa
import transaction
from datetime import datetime


from assembl.lib import config
from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('discussion', sa.Column('active_start_date', sa.DateTime))
        op.add_column('discussion', sa.Column('active_stop_date', sa.DateTime))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        # Transfer all extra_json dates to this column, if exists
        discussion_ids = db.query(m.Discussion.id, m.Discussion.slug, m.Discussion.preferences_id).all()
        for d_id, slug, pref_id in discussion_ids:
            pref = db.query(m.Preferences).filter_by(id=pref_id).first()
            extra = pref['extra_json']
            if 'dates' in extra:
                dates = extra['dates']
                print("Checking if both start and end dates from Discussion %s exist" % slug)
                if 'startDate' in dates and 'endDate' in dates:
                    print("Migrating Discussion %s's dates to model from extra_json" % slug)
                    try:
                        start_date = datetime.strptime(dates.startDate, "%Y-%m-%d")
                        stop_date = datetime.strptime(dates.startDate, "%Y-%m-%d")
                        if start_date and stop_date:
                            d = m.Discussion.__table__
                            db.execute(d.update().where(d.c.id == d_id).values(active_start_date=start_date))
                            db.execute(d.update().where(d.c.id == d_id).values(active_stop_date=stop_date))
                            db.flush()
                    except:
                        print("Failed to convert Discussion %s's dates to model" % slug)
                else:
                    print("Not both start and end dates from Discussion %s are set! Skipped..." % slug)
            else:
                # Try to use phases
                print("Migrating Discussion %s's dates to model from phases" % slug)
                phases = db.query(m.TimelineEvent).filter_by(discussion_id=d_id).order_by(m.TimelineEvent.start.desc()).all()
                if phases:
                    try:
                        start_date = phases[0].start
                        end_date = phases[-1].end
                        if start_date and end_date and end_date < start_date:
                            raise Exception("End date %s is earlier than the start date %s!" % end_date, start_date)
                        if start_date:
                            d = m.Discussion.__table__
                            db.execute(d.update().where(d.c.id == d_id).values(active_start_date=start_date))
                        if end_date:
                            d = m.Discussion.__table__
                            db.execute(d.update().where(d.c.id == d_id).values(active_start_date=start_date))
                    except:
                        print("Failed to convert Discussion %s's dates to model" % slug)
                else:
                    print("There are no set phases for Discussion %s to continue. Skipped..." % slug)
        mark_changed(db)


def downgrade(pyramid_env):
    # Only drop the columsn, as the calculation of these columns does not allow reversion
    with context.begin_transaction():
        op.drop_column('discussion', 'active_stop_date')
        op.drop_column('discussion', 'active_start_date')
