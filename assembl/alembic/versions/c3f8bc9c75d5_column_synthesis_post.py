# -*- coding: utf-8 -*-
"""Migrate IdeaMessageColumn.header field to ColumnSynthesisPost

Revision ID: c3f8bc9c75d5
Revises: c5754a7cb6be
Create Date: 2017-12-12 09:50:52.192838

"""

# revision identifiers, used by Alembic.
revision = 'c3f8bc9c75d5'
down_revision = '8ed4db9d977f'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.auth import R_SYSADMIN
from assembl.lib import config
from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        # take the first sysadmin as creator
        sysadmin_role = db.query(m.Role).filter(m.Role.name == R_SYSADMIN).first()
        creator_id = m.User.default_db.query(m.User).join(
            m.User.roles).filter(m.Role.id == sysadmin_role.id)[0:1][0].id
        columns_headers = dict(list(db.execute(
            "SELECT id, header_id FROM idea_message_column")))
        columns = db.query(m.IdeaMessageColumn).all()
        for column in columns:
            synthesis = column.get_column_synthesis()
            header_id = columns_headers.get(column.id, None)
            if header_id is not None and synthesis is None:
                name_en = column.name.closest_entry('en') or column.name.first_original()
                name_fr = column.name.closest_entry('fr') or column.name.first_original()
                subject_ls = m.LangString.create(u"Synthesis: {}".format(name_en.value), 'en')
                subject_ls.add_value(u"Synthèse : {}".format(name_fr.value), 'fr')
                body_ls = m.LangString.get(header_id)  # don't clone, reuse the same langstring
                column.create_column_synthesis(
                    subject=subject_ls,
                    body=body_ls,
                    creator_id=creator_id)

    with context.begin_transaction():
        op.drop_column('idea_message_column', 'header_id')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idea_message_column', sa.Column('header_id',
            sa.Integer(), sa.ForeignKey('langstring.id')))

    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        columns = db.query(m.IdeaMessageColumn).all()
        for column in columns:
            synthesis = column.get_column_synthesis()
            if synthesis is not None:
                header = synthesis.body.clone()
                # we need to clone here, otherwise the langstring is deleted with db.delete(synthesis)
                # because of the delete-orphan on the relationship and result to an Integrity error
                # because the langstring is still referenced from idea_message_column table.
                db.add(header)
                db.flush()
                # we can't use here: column.header_id = header.id
                # the mapper doesn't now about header_id and the change
                # will not be committed
                db.execute("""update idea_message_column set header_id = %d
                    where id = %d""" % (header.id, column.id))
                mark_changed()
                db.delete(synthesis)
