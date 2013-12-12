"""URIs in extract-ids

Revision ID: 30b910cff69d
Revises: 181c5188b517
Create Date: 2013-12-06 10:18:34.255421

"""

# revision identifiers, used by Alembic.
revision = '30b910cff69d'
down_revision = '181c5188b517'

import re

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl.models import Extract, TextFragmentIdentifier, Content, Post
    db = Extract.db()
    reg = re.compile(r"^//div\[@id='message-([0-9]+)'\](.*)")
    with transaction.manager:
        db.query(TextFragmentIdentifier).filter_by(extract=None).delete()
        for tfi in db.query(TextFragmentIdentifier).join(
                Extract, Content, Post).all():
            xpo = tfi.xpath_start
            print xpo
            match = reg.match(xpo)
            if match:
                id, remainder = match.groups()
                uri = Post.uri_generic(id)
                xp = "//div[@id='message-%s']%s" % (
                    uri, remainder)
                print xp
                tfi.xpath_start = tfi.xpath_end = xp

def downgrade(pyramid_env):
    pass
