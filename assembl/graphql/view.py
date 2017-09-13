from pyramid.view import view_config
from pyramid.response import Response
from pyramid.renderers import render_to_response
from pyramid.settings import asbool
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone
from pyramid.httpexceptions import (
    HTTPNotFound, HTTPSeeOther)
from graphql_wsgi import graphql_wsgi

from assembl import models
from assembl.auth import CrudPermissions
from assembl.auth.util import get_permissions
from assembl.auth import P_READ, P_ADD_EXTRACT
from assembl.auth.util import user_has_permission, effective_userid
from assembl.lib import config as AssemblConfig
from assembl.graphql.schema import Schema


# Only allow POST (query may be GET, but mutations should always be a POST,
# but there is no such check for now in graphql-wsgi)
@view_config(request_method='POST', route_name='graphql')
def graphql_api(request):
    slug = request.matchdict['discussion_slug']
    # Check permission
    discussion = models.Discussion.query.filter(models.Discussion.slug == slug).one()
    if discussion is None:
        raise HTTPUnauthorized()

    discussion_id = discussion.id
    # set discussion_id in request.matchdict which is use as context_value
    request.matchdict['discussion_id'] = discussion_id
    user_id = effective_userid(request) or Everyone
    permissions = get_permissions(user_id, discussion_id)
    if not discussion.user_can(user_id, CrudPermissions.READ, permissions):
        raise HTTPUnauthorized()

    solver = graphql_wsgi(Schema)
    return solver(request)
