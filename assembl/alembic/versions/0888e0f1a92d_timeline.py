"""timeline

Revision ID: 0888e0f1a92d
Revises: 498e7af689d2
Create Date: 2017-02-27 12:12:45.625018

"""

# revision identifiers, used by Alembic.
revision = '0888e0f1a92d'
down_revision = '498e7af689d2'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed

def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'timeline_event',
            sa.Column('title_id', sa.Integer(),
                      sa.ForeignKey('langstring.id')))
        op.add_column(
            'timeline_event',
            sa.Column('description_id', sa.Integer(),
                      sa.ForeignKey('langstring.id')))
        op.add_column(
            'timeline_event',
            sa.Column('image_url', sa.String()))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        data = list(db.execute(
            "SELECT discussion_id, id, title, description FROM timeline_event"))
        if data:
            discussion_ids = {d[0] for d in data}
            discussions = db.query(m.Discussion).filter(m.Discussion.id.in_(discussion_ids)).all()
            locales = {d.id: d.main_locale for d in discussions}
            for d_id, ev_id, title, description in data:
                title = m.LangString.create(title, locales[d_id])
                description = m.LangString.create(description, locales[d_id])
                db.add(title)
                db.add(description)
                db.flush()
                db.execute(
                    'UPDATE timeline_event SET title_id=%d, description_id=%d WHERE id = %d' % (
                    title.id, description.id, ev_id))
            mark_changed()

    with context.begin_transaction():
        op.drop_column('timeline_event', 'title')
        op.drop_column('timeline_event', 'description')
        op.alter_column('timeline_event', 'title_id', nullable=False)


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'timeline_event',
            sa.Column('title', sa.Unicode()))
        op.add_column(
            'timeline_event',
            sa.Column('description', sa.UnicodeText))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        # This assumes as single LangStringEntry per timeline event.
        # Not true in general, but enough to revert the upgrade.
        data = list(db.execute(
            """SELECT te.id, title.langstring_id, description.langstring_id,
                title.value, description.value FROM timeline_event AS te
            JOIN langstring_entry AS title ON title.langstring_id = te.title_id
            LEFT JOIN langstring_entry AS description ON description.langstring_id = te.description_id"""))
        ids = []
        if data:
            for ev_id, t_id, d_id, title, description in data:
                db.execute(
                    'UPDATE timeline_event SET title=:title, description=:desc WHERE id = :id',
                    {"title": title, "desc": description, "id": ev_id})
                ids.extend([str(t_id), str(d_id)])
            mark_changed()

    with context.begin_transaction():
        op.drop_column('timeline_event', 'title_id')
        op.drop_column('timeline_event', 'description_id')
        op.drop_column('timeline_event', 'image_url')
        # after title_id and description_id are gone
        if ids:
            ids = (",".join(ids),)
            op.execute(
                "DELETE FROM langstring_entry WHERE langstring_id IN (%s)" % ids)
            op.execute(
                "DELETE FROM langstring WHERE id IN (%s)" % ids)
        op.alter_column('timeline_event', 'title', nullable=False)
