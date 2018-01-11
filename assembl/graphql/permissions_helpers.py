from pyramid.security import Everyone
from pyramid.httpexceptions import HTTPUnauthorized
from assembl.auth.util import get_permissions


def make_cls_permissions_querier(cls, request):
    user_id = request.authenticated_userid or Everyone
    discussion_id = request.matchdict['discussion_id']

    def require_permission(permission_type):
        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(user_id, permission_type, permissions)
        if not allowed:
            raise HTTPUnauthorized()
    return require_permission


def make_instance_permissions_querier(instance, request):
    user_id = request.authenticated_userid or Everyone
    discussion_id = request.matchdict['discussion_id']

    def require_permission(permission_type):
        permissions = get_permissions(user_id, discussion_id)
        allowed = instance.user_can(user_id, permission_type, permissions)
        if not allowed:
            raise HTTPUnauthorized()
    return require_permission
