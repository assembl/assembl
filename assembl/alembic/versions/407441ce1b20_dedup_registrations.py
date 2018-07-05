"""dedup_registrations

Revision ID: 407441ce1b20
Revises: ce427c9d6013
Create Date: 2018-06-03 15:48:35.931332

"""

# revision identifiers, used by Alembic.
revision = '407441ce1b20'
down_revision = 'ce427c9d6013'

from alembic import context, op
import sqlalchemy as sa
import transaction
from collections import defaultdict
from operator import or_
from sqlalchemy.orm import joinedload
from datetime import datetime

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        bymail = defaultdict(list)
        emails = db.query(m.EmailAccount).options(
            joinedload(m.EmailAccount.profile)).all()
        for e in emails:
            bymail[e.email].append(e)

        # all emails with duplicate accounts
        duplicates = [v for v in bymail.values() if len(v) > 1]

        def order(acc):
            pre_assembl_life = datetime(year=2000, month=1, day=1)
            return (acc.verified, getattr(acc.profile, 'creation_date', pre_assembl_life))

        with db.no_autoflush as db:
            for dups in duplicates:
                # the "best" (verified, latest) will be last
                dups.sort(key=order)
                for acc in dups[:-1]:
                    assert not acc.verified
                acc = dups[-1]
                # Make the profile verified iff one verified account
                if isinstance(acc.profile, m.User):
                    acc.profile.verified = reduce(or_, [getattr(a, 'verified', False) for a in acc.profile.accounts])

            for dups in duplicates:
                # keep last profile
                keep_profile = dups[-1].profile_id
                for acc in dups[:-1]:
                    acc.delete()
                    # i.e. delete profile if not last.
                    # There were cases of 2 accounts to one profile, one verified
                    if acc.profile_id != keep_profile:
                        if isinstance(acc.profile, m.User):
                            if acc.profile.username:
                                acc.profile.username.delete()
                        acc.profile.delete()

        db.flush()


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
