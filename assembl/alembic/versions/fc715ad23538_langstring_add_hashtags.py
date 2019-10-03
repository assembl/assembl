# -*- coding: utf-8 -*-
"""Langstring: add hashtags

Revision ID: fc715ad23538
Revises: 33735b0850fc
Create Date: 2019-10-02 19:06:51.235450

"""

# revision identifiers, used by Alembic.
from sqlalchemy import or_
from sqlalchemy.dialects import postgresql

revision = 'fc715ad23538'
down_revision = '33735b0850fc'

import sqlalchemy as sa
import transaction
from alembic import context, op
from assembl.lib import config


def upgrade(pyramid_env):
    from assembl.models import langstrings
    with context.begin_transaction():
        op.add_column('langstring_entry',
                      sa.Column('hashtags', postgresql.ARRAY(sa.String)),
                      )

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    try:
        with transaction.manager:
            query = db.query(m.LangStringEntry).filter(m.LangStringEntry.value.contains(u'#'))
            for langstring in query:
                langstring.hashtags = langstrings.analyse_hashtags(langstring.value)
    except (Exception, KeyboardInterrupt):
        op.drop_column('langstring_entry', 'hashtags')
        raise


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('langstring_entry', 'hashtags')
