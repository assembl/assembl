# -*- coding=utf-8 -*-
"""update_multimedia_module

Revision ID: 083c79582c91
Revises: 39b04e9d2716
Create Date: 2018-04-17 10:41:58.466035

"""

# revision identifiers, used by Alembic.
revision = '083c79582c91'
down_revision = '39b04e9d2716'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        lpmt = db.query(m.LandingPageModuleType).filter(m.LandingPageModuleType.identifier == u"INTRODUCTION").first()
        if lpmt:
            ls = lpmt.title
            ls.add_value(u"Text & Multimedia", "en")
            ls.add_value(u"Texte & Multimédia", "fr")
        db.flush()


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
