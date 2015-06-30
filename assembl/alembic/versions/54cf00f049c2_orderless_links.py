"""orderless links

Revision ID: 54cf00f049c2
Revises: 3294b9c51452
Create Date: 2015-06-29 13:24:21.170411

"""

# revision identifiers, used by Alembic.
revision = '54cf00f049c2'
down_revision = '3294b9c51452'

from collections import defaultdict

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.sql.functions import count
from sqlalchemy.orm import aliased
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl.models import IdeaLink, get_session_maker
    db = get_session_maker()()
    # First, reorder live links.
    with transaction.manager:
        ids = db.query(IdeaLink.source_id)\
            .filter(IdeaLink.tombstone_date == None)\
            .group_by(IdeaLink.source_id, IdeaLink.order)\
            .having((count(IdeaLink.id) > 1)).all()
        for (source_id,) in ids:
            links = db.query(IdeaLink).filter_by(
                source_id=source_id,
                tombstone_date=None).order_by(
                IdeaLink.order, IdeaLink.id).all()
            for n, link in enumerate(links):
                link.order = n + 1
        # Then dead links
        q = db.query(
            IdeaLink.source_id, IdeaLink.tombstone_date).\
            group_by(IdeaLink.source_id, IdeaLink.order,
                     IdeaLink.tombstone_date).\
            having((count(IdeaLink.id) > 1)).all()
        for (source_id, date) in q:
            if not date:
                continue
            dest_links = db.query(IdeaLink).filter_by(
                source_id=source_id,
                tombstone_date=date).all()
            # Try to find the order of the ordered link the closest
            # in date to each current link.
            all_links = db.query(IdeaLink).filter_by(source_id=source_id).all()
            by_base_id = defaultdict(list)
            for link in all_links:
                by_base_id[link.base_id].append(link)
            signatures = {}
            for dest in dest_links:
                base_id = dest.base_id
                links = by_base_id[base_id]
                # source_id should be the same.
                links = [l for l in links if l.order]

                def distance(l):
                    if l == dest:
                        return -1
                    if not l.tombstone_date:
                        return 0
                    return abs((l.tombstone_date-dest.tombstone_date).seconds)
                links.sort(key=distance)
                signatures[base_id] = tuple((l.order for l in links))
            dest_links.sort(key=lambda l: signatures[l.base_id])
            for n, link in enumerate(dest_links):
                link.order = n


def downgrade(pyramid_env):
    pass
