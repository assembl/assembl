
from pyramid.view import view_config
from pyramid.security import authenticated_userid
from pyramid.httpexceptions import HTTPNotImplemented

from assembl.auth import (P_READ, P_SYSADMIN)
from assembl.models import (ContentSource, FeedPostSource)
from assembl.auth.util import get_permissions
from ..traversal import InstanceContext
from . import FORM_HEADER
from assembl.tasks.source_reader import wake

@view_config(context=InstanceContext, request_method='POST',
             ctx_instance_class=ContentSource, permission=P_READ,
             header=FORM_HEADER, renderer='json', name="fetch_posts")
def fetch_posts(request):
    # Temporary: Restrict to FeedPostSource
    # until the IMAP sources are tested.
    ctx = request.context
    csource = ctx._instance
    if not isinstance(csource, FeedPostSource):
        # But let sysadmins still experiment with this...
        user_id = authenticated_userid(request)
        permissions = get_permissions(
            user_id, ctx.get_discussion_id())
        if P_SYSADMIN not in permissions:
            raise HTTPNotImplemented()
    force_restart = request.params.get('force_restart', False)
    reimport = request.params.get('reimport', False)
    wake(csource.id, reimport, force_restart)
    return {"message":"Source notified",
            "name": csource.name}
