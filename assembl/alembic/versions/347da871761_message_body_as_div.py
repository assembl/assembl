"""message-body as div

Revision ID: 347da871761
Revises: 2e2939148eb0
Create Date: 2013-11-05 16:45:59.227973

"""

# revision identifiers, used by Alembic.
revision = '347da871761'
down_revision = '2e2939148eb0'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for tfi in db.query(m.TextFragmentIdentifier).all():
            xp = xpo = tfi.xpath_start
            if not xp and tfi.extract.source.type == 'email':
                xp = "//div[@data-message-id='%d']//div[@class='message-body']" % (
                    tfi.extract.source.post.id)
            elif xp.endswith("//span[@class='message-body']"):
                xp = xp[:-29] + "//div[@class='message-body']"
            if xp != xpo:
                tfi.xpath_start = xp
                tfi.xpath_end = xp


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
