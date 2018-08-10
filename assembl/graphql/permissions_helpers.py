from pyramid.security import Everyone
from pyramid.httpexceptions import HTTPUnauthorized

from assembl.auth.util import get_permissions


def require_cls_permission(permission_type, cls, request):
    user_id = request.authenticated_userid or Everyone
    discussion_id = request.matchdict['discussion_id']
    permissions = get_permissions(user_id, discussion_id)
    allowed = cls.user_can_cls(user_id, permission_type, permissions)
    if not allowed:
        raise HTTPUnauthorized()


def require_instance_permission(permission_type, instance, request):
    user_id = request.authenticated_userid or Everyone
    discussion_id = request.matchdict['discussion_id']
    permissions = get_permissions(user_id, discussion_id)
    allowed = instance.user_can(user_id, permission_type, permissions) if instance else False
    if not allowed:
        raise HTTPUnauthorized()
