from pyramid.security import Everyone
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.i18n import TranslationStringFactory
from assembl.auth.util import get_permissions
from assembl.auth import IF_OWNED


_ = TranslationStringFactory('assembl')
error = _('It looks like you do not have the right to do this action. If you think it is an error, please reconnect to the platform and try again.')


def require_cls_permission(permission_type, cls, request):
    user_id = request.authenticated_userid or Everyone
    discussion_id = request.matchdict['discussion_id']
    permissions = get_permissions(user_id, discussion_id)
    allowed = cls.user_can_cls(user_id, permission_type, permissions)
    if not allowed or (allowed == IF_OWNED and user_id == Everyone):
        raise HTTPUnauthorized(request.localizer.translate(error))


def require_instance_permission(permission_type, instance, request):
    user_id = request.authenticated_userid or Everyone
    discussion_id = request.matchdict['discussion_id']
    permissions = get_permissions(user_id, discussion_id)
    allowed = instance.user_can(user_id, permission_type, permissions) if instance else False
    if not allowed:
        raise HTTPUnauthorized(request.localizer.translate(error))
