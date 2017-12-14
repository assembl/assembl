"""Cornice API for discussions"""
import json

from pyramid.httpexceptions import HTTPNotFound, HTTPUnauthorized, HTTPNoContent
from pyramid.security import Everyone, Authenticated

from cornice import Service

from . import API_DISCUSSION_PREFIX, API_ETALAB_DISCUSSIONS_PREFIX

from assembl.models import Discussion
from assembl.auth.util import discussions_with_access

from ...auth import P_READ, P_ADMIN_DISC, P_SYSADMIN
from ...auth.util import get_permissions


discussion = Service(
    name='discussion',
    path=API_DISCUSSION_PREFIX,
    description="Manipulate a single Discussion object",
    renderer='json',
)

etalab_discussions = Service(
    name='etalab_discussions',
    path=API_ETALAB_DISCUSSIONS_PREFIX,
    description="Etalab endpoint to GET the list of existing Discussion objects, and to POST a new discussion",
    renderer='json'
)

etalab_discussion = Service(
    name='etalab_discussion',
    path=API_ETALAB_DISCUSSIONS_PREFIX + "/{discussion_id:\d+}",
    description="Etalab endpoint to GET or DELETE an existing Discussion object",
    renderer='json'
)


@etalab_discussions.get()
def etalab_get_discussions(request):
    # According to the Etalab API specification, an Instance object must have the following fields:
    # - url: we send discussion.get_url(). Note: a discussion may have 2 URLs (HTTP and HTTPS). For this, see discussion.get_discussion_urls()
    # - name: we use discussion.topic
    # - adminEmail: email of the discussion creator, who made the API request to create a discusison (so in our case the field will not show if the discussion has been created by another mean)
    # - adminName: name of this guy, also provided in the discussion creation request (so in our case the field will not show if the discussion has been created by another mean)
    # - createdAt: creation date
    # We also send the following optional fields:
    # - id: this field is not in specification's optional nor mandatory fields
    # - status: "running"
    # - metadata: metadata.creation_date => will probably be renamed, see above
    view = "etalab"
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(user_id, None)
    if P_READ not in permissions:
        raise HTTPUnauthorized()
    discussions = discussions_with_access(user_id)
    return {"items": [discussion.generic_json(view, user_id, permissions)
                      for discussion in discussions]}


@etalab_discussion.get(permission=P_READ)
@discussion.get(permission=P_READ)
def get_discussion(request):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get_instance(discussion_id)
    is_etalab_request = request.matched_route.name == 'etalab_discussion'
    view_def = request.GET.get(
        'view', 'etalab' if is_etalab_request else 'default')
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(user_id, discussion_id)

    if not discussion:
        raise HTTPNotFound(
            "Discussion with id '%s' not found." % discussion_id)

    return discussion.generic_json(view_def, user_id, permissions)


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


@etalab_discussion.delete(permission=P_SYSADMIN)
@discussion.delete(permission=P_SYSADMIN)
def delete_discussion(request):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get_instance(discussion_id)

    if not discussion:
        raise HTTPNotFound(
            "Discussion with id '%s' not found." % discussion_id)

    discussion.delete()
    return HTTPNoContent()
