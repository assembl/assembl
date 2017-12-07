from pyramid.view import view_config
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone
from graphql_wsgi import graphql_wsgi

from assembl import models
from assembl.auth import CrudPermissions
from assembl.auth.util import get_permissions
from assembl.graphql.schema import Schema


# Only allow POST (query may be GET, but mutations should always be a POST,
# but there is no such check for now in graphql-wsgi)
@view_config(request_method='POST', route_name='graphql')
def graphql_api(request):
    slug = request.matchdict['discussion_slug']
    # Check permission
    discussion = models.Discussion.query.filter(
        models.Discussion.slug == slug).one()
    if discussion is None:
        raise HTTPUnauthorized()

    discussion_id = discussion.id
    # set discussion_id in request.matchdict which is use as context_value
    request.matchdict['discussion_id'] = discussion_id
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(user_id, discussion_id)
    if not discussion.user_can(user_id, CrudPermissions.READ, permissions):
        raise HTTPUnauthorized()

    solver = graphql_wsgi(Schema)
    return solver(request)
