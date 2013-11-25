import json
import transaction

from cornice import Service

from pyramid.security import authenticated_userid
from pyramid.httpexceptions import HTTPNotFound, HTTPBadRequest
from sqlalchemy.orm import aliased, joinedload, joinedload_all, contains_eager

from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.auth.models import (
    AgentProfile, User, Role, Permission, UserRole,
    LocalUserRole, DiscussionPermission)
from assembl.synthesis.models import Discussion
from . import acls
from assembl.auth import (
    P_READ, P_ADMIN_DISC, P_SYSADMIN, SYSTEM_ROLES)
from assembl.auth.token import decode_token


cors_policy = dict(
    enabled=True, origins=('*',), credentials=True, max_age=86400,
    headers=('Location', 'Content-Type', 'Content-Length'))


permissions = Service(
    name='permissions',
    path=API_DISCUSSION_PREFIX + '/permissions',
    description="The permissions for a given discussion",
    renderer='json', acl=acls, cors_policy=cors_policy
)

permissions_for_role = Service(
    name='permissions_for_role',
    path=API_DISCUSSION_PREFIX + '/permissions/r/{role_name}',
    description="The permissions for a single role",
    acl=acls, cors_policy=cors_policy
)

roles = Service(
    name='roles',
    path=API_DISCUSSION_PREFIX + '/roles',
    description="The roles defined in the system",
    renderer='json', acl=acls, cors_policy=cors_policy
)

global_roles_for_user = Service(
    name='generic_roles_for_user',
    path=API_DISCUSSION_PREFIX + '/roles/for/{user_id}/global',
    description="The universal roles of a given user",
    renderer='json', acl=acls, cors_policy=cors_policy
)

discussion_roles_for_user = Service(
    name='discussion_roles_for_user',
    path=API_DISCUSSION_PREFIX + '/roles/for/{user_id}/local',
    description="The per-discussion roles of a given user",
    renderer='json', acl=acls, cors_policy=cors_policy
)


@permissions.get(permission=P_READ)
def get_permissions_for_discussion(request):
    discussion_id = request.matchdict['discussion_id']
    session = Discussion.db()
    discussion = session.query(Discussion).get(discussion_id)
    return discussion.get_permissions_by_role()


@permissions_for_role.get(permission=P_READ)
def get_permissions_for_role(request):
    discussion_id = request.matchdict['discussion_id']
    role_name = request.matchdict['role_name']
    session = Discussion.db()
    discussion = session.query(Discussion).get(discussion_id)
    role = Role.get(name=role_name)
    if not role:
        raise HTTPNotFound("Role %s does not exist" % (role_name,))
    return discussion.get_permissions_by_role().get(role_name, [])


@permissions_for_role.put(permission=P_ADMIN_DISC)
def put_permissions_for_role(request):
    discussion_id = request.matchdict['discussion_id']
    role_name = request.matchdict['role_name']
    session = Discussion.db()
    discussion = session.query(Discussion).get(discussion_id)
    role = Role.get(name=role_name)
    if not role:
        raise HTTPNotFound("Role %s does not exist" % (role_name,))
    try:
        data = json.loads(request.body)
    except Exception as e:
        raise HTTPBadRequest("Malformed Json")
    if not isinstance(data, list):
        raise HTTPBadRequest("Not a list")
    if data and frozenset((type(x) for x in data)) != frozenset((str,)):
        raise HTTPBadRequest("not strings")
    permissions = set(session.query(Permission).filter(name in data).all())
    data = set(data)
    if len(permissions) != len(data):
        raise HTTPBadRequest("Not valid permissions: %s" % (repr(
            data - set((p.name for p in permissions))),))
    known_dp = session.query(DiscussionPermission).join(Permission).filter(
        role=role, discussion=discussion).all()
    dp_by_permission = {dp.permission.name: dp for dp in known_dp}
    known_permissions = set(dp.keys())
    for permission in known_permissions - permissions:
        session.delete(dp_by_permission(permission))
    for permission in permissions - known_permissions:
        session.add(DiscussionPermission(
            role=role, permission=permission, discussion=discussion))
    return {"added": list(permissions - known_permissions),
            "removed": list(known_permissions - permissions)}


@roles.get(permission=P_READ)
def get_roles(request):
    session = Role.db()
    roles = session.query(Role)
    return [r.name for r in roles]

@roles.put(permission=P_SYSADMIN)
def put_roles(request):
    session = Role.db()
    try:
        data = json.loads(request.body)
    except Exception as e:
        raise HTTPBadRequest("Malformed Json")
    if not isinstance(data, list):
        raise HTTPBadRequest("Not a list")
    if data and frozenset((type(x) for x in data)) != frozenset((str,)):
        raise HTTPBadRequest("not strings")
    data = set(data)
    known_roles = session.query(Role).all()
    roles_by_name = {r.name: r for r in known_roles}
    role_names = set(roles_by_name.keys())
    # new roles
    for name in data - role_names:
        session.add(Role(name=name))
    # delete non-system roles.
    for name in role_names - data - SYSTEM_ROLES:
        session.delete(roles_by_name[name])
    return {"added": list(data - role_names),
            "removed": list(role_names - data - SYSTEM_ROLES)}


@global_roles_for_user.get(permission=P_READ)
def get_global_roles_for_user(request):
    user_id = request.matchdict['user_id']
    session = User.db()
    if not session.query(User).get(user_id):
        raise HTTPNotFound("User id %d does not exist" % (user_id,))
    rolenames = session.query(Role.name).join(
        UserRole).filter(UserRole.user_id == user_id)
    return [x[0] for x in rolenames]


@global_roles_for_user.put(permission=P_SYSADMIN)
def put_global_roles_for_user(request):
    user_id = request.matchdict['user_id']
    session = User.db()
    user = session.query(User).get(user_id)
    if not user:
        raise HTTPNotFound("User id %d does not exist" % (user_id,))
    try:
        data = json.loads(request.body)
    except Exception as e:
        raise HTTPBadRequest("Malformed Json")
    if not isinstance(data, list):
        raise HTTPBadRequest("Not a list")
    if data and frozenset((type(x) for x in data)) != frozenset((str,)):
        raise HTTPBadRequest("not strings")
    roles = set(session.query(Role).filter(name in data).all())
    data = set(data)
    if len(roles) != len(data):
        raise HTTPBadRequest("Not valid roles: %s" % (repr(
            data - set((p.name for p in roles))),))
    known_gu_roles = session.query(UserRole).join(Role).filter(
        user=user).all()
    gur_by_role = {gur.role.name: gur for gur in known_gu_roles}
    known_roles = set(gur_by_role.keys())
    for role in known_roles - roles:
        session.query.delete(gur_by_role(role))
    for role in roles - known_roles:
        session.add(UserRole(user=user, role=role))
    return {"added": list(roles - known_roles),
            "removed": list(known_roles - roles)}


@discussion_roles_for_user.get(permission=P_READ)
def get_discussion_roles_for_user(request):
    discussion_id = request.matchdict['discussion_id']
    user_id = request.matchdict['user_id']
    session = Discussion.db()
    if not session.query(User).get(user_id):
        raise HTTPNotFound("User id %d does not exist" % (user_id,))
    rolenames = session.query(Role.name).join(
        LocalUserRole).filter(LocalUserRole.user_id == user_id,
                              LocalUserRole.discussion_id == discussion_id)
    return [x[0] for x in rolenames]


@discussion_roles_for_user.put(permission=P_ADMIN_DISC)
def put_discussion_roles_for_user(request):
    discussion_id = request.matchdict['discussion_id']
    user_id = request.matchdict['user_id']
    session = Discussion.db()
    discussion = session.query(Discussion).get(discussion_id)
    user = session.query(User).get(user_id)
    if not user:
        raise HTTPNotFound("User id %d does not exist" % (user_id,))
    try:
        data = json.loads(request.body)
    except Exception as e:
        raise HTTPBadRequest("Malformed Json")
    if not isinstance(data, list):
        raise HTTPBadRequest("Not a list")
    if data and frozenset((type(x) for x in data)) != frozenset((str,)):
        raise HTTPBadRequest("not strings")
    roles = set(session.query(Role).filter(name in data).all())
    data = set(data)
    if len(roles) != len(data):
        raise HTTPBadRequest("Not valid roles: %s" % (repr(
            data - set((p.name for p in roles))),))
    known_lu_roles = session.query(LocalUserRole).join(Role).filter(
        user=user, discussion=discussion).all()
    lur_by_role = {lur.role.name: lur for lur in known_lu_roles}
    known_roles = set(lur_by_role.keys())
    for role in known_roles - roles:
        session.query.delete(lur_by_role(role))
    for role in roles - known_roles:
        session.add(LocalUserRole(
            user=user, role=role, discussion=discussion))
    return {"added": list(roles - known_roles),
            "removed": list(known_roles - roles)}
