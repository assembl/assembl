"""override_social_autologin

Revision ID: 27f58fce7b77
Revises: c5754a7cb6be
Create Date: 2017-12-12 11:47:45.917957

"""

# revision identifiers, used by Alembic.
revision = '27f58fce7b77'
down_revision = 'c5754a7cb6be'

from itertools import product

from simplejson import loads, dumps
from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib.sqla import mark_changed
from assembl.lib import config
from assembl.auth import R_PARTICIPANT, Everyone, Authenticated, P_OVERRIDE_SOCIAL_AUTOLOGIN

base_roles = set((R_PARTICIPANT, Everyone, Authenticated))

def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        m.Permission.populate_db(db)
        db.flush()
        changes = []
        for (id, name, values) in db.execute(
                'SELECT id, name, values FROM preferences'):
            values = loads(values or '{}')
            if 'default_permissions' in values:
                found = False
                for role, permissions in list(values['default_permissions'].items()):
                    if role not in base_roles:
                        if P_OVERRIDE_SOCIAL_AUTOLOGIN not in permissions:
                            permissions.append(P_OVERRIDE_SOCIAL_AUTOLOGIN)
                            values['default_permissions'][role] = permissions
                            found = True
                if found:
                    changes.append({'id': id, 'pref_json': dumps(values)})
        if changes:
            db.bulk_update_mappings(m.Preferences.__mapper__, changes)
        role_ids = [
            id for (id, name)
            in db.execute('SELECT id, name FROM role')
            if name not in base_roles]
        discussions = list(db.execute("SELECT id FROM discussion"))
        discussions = [id for (id,) in discussions]
        (permission_id,) = db.execute(
            "SELECT id FROM permission WHERE name='%s'" % (
                P_OVERRIDE_SOCIAL_AUTOLOGIN)).first()
        db.bulk_insert_mappings(m.DiscussionPermission, [
            {'discussion_id': d, 'role_id': r, 'permission_id': permission_id}
            for (d, r) in product(discussions, role_ids)])
        mark_changed()


def downgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        changes = []
        for (id, name, values) in db.execute(
                'SELECT id, name, values FROM preferences'):
            values = loads(values or '{}')
            if 'default_permissions' in values:
                found = False
                for role, permissions in list(values['default_permissions'].items()):
                    try:
                        permissions.remove(P_OVERRIDE_SOCIAL_AUTOLOGIN)
                        values['default_permissions'][role] = permissions
                        found = True
                    except ValueError:
                        continue
                if found:
                    changes.append({'id': id, 'pref_json': dumps(values)})
        if changes:
            db.bulk_update_mappings(m.Preferences.__mapper__, changes)
        (permission_id,) = db.execute(
            "SELECT id FROM permission WHERE name='%s'" % (
                P_OVERRIDE_SOCIAL_AUTOLOGIN)).first()
        db.execute("DELETE FROM discussion_permission WHERE permission_id="+str(permission_id))
        db.execute("DELETE FROM permission WHERE id="+str(permission_id))
        mark_changed()
