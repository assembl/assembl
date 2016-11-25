"""Cornice API for discussions"""
import json

from pyramid.httpexceptions import HTTPNotFound
from pyramid.security import authenticated_userid, Everyone

from cornice import Service

from assembl.views.api import API_DISCUSSION_PREFIX, API_ETALAB_DISCUSSIONS_PREFIX

from assembl.models import Discussion


from ...auth import P_READ, P_ADMIN_DISC
from ...auth.util import get_permissions


discussion = Service(
    name='discussion',
    path=API_DISCUSSION_PREFIX,
    description="Manipulate a single Discussion object",
    renderer='json',
)


@discussion.get(permission=P_READ)
def get_discussion(request):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get_instance(discussion_id)
    view_def = request.GET.get('view') or 'default'
    user_id = authenticated_userid(request) or Everyone
    permissions = get_permissions(user_id, discussion_id)

    if not discussion:
        raise HTTPNotFound(
            "Discussion with id '%s' not found." % discussion_id)

    return discussion.generic_json(view_def, user_id, permissions)


# This should be a PUT, but the backbone save method is confused by
# discussion URLs.
@discussion.put(permission=P_ADMIN_DISC)
def post_discussion(request):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get_instance(discussion_id)

    if not discussion:
        raise HTTPNotFound(
            "Discussion with id '%s' not found." % discussion_id)

    discussion_data = json.loads(request.body)

    discussion.topic = discussion_data.get('topic', discussion.slug)
    discussion.slug = discussion_data.get('slug', discussion.slug)
    discussion.objectives = discussion_data.get(
        'objectives', discussion.objectives)

    return {'ok': True}

