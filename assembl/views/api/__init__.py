import os

from pyramid.security import Allow, ALL_PERMISSIONS
from pyramid.httpexceptions import HTTPNotFound, HTTPInternalServerError

from assembl.auth.models import (
    DiscussionPermission, Role, Permission, R_SYSADMIN)
from assembl.models import Discussion

FIXTURE_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', 'static', 'js', 'tests', 'fixtures')
API_PREFIX = '/api/v1/'
API_DISCUSSION_PREFIX = API_PREFIX + 'discussion/{discussion_id:\d+}'


def acls(request):
    if request.matchdict and 'discussion_id' in request.matchdict:
        discussion_id = int(request.matchdict['discussion_id'])
        rps = DiscussionPermission.db.query(
            Role.name, Permission.name).select_from(
            DiscussionPermission).join(Role, Permission).filter(
            DiscussionPermission.discussion_id==discussion_id)
        acls = [(Allow, r, p) for (r, p) in rps]
        if not acls:
            discussion = Discussion.get_instance(discussion_id)
            if not discussion:
                raise HTTPNotFound("No discussion ID %d" % (discussion_id,))
            raise HTTPInternalServerError(
                "Discussion ID %d has no permissions" % (discussion_id,))
        acls.append((Allow, R_SYSADMIN, ALL_PERMISSIONS))
        return acls
    return []

def includeme(config):
    """ Initialize views and renderers at app start-up time. """

    config.add_route('csrf_token', 'api/v1/token')
