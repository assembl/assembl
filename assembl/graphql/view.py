from pyramid.view import view_config
from pyramid.response import Response
from pyramid.renderers import render_to_response
from pyramid.settings import asbool
from pyramid.security import authenticated_userid, Everyone
from pyramid.httpexceptions import (
    HTTPNotFound, HTTPSeeOther)
from graphql_wsgi import graphql_wsgi

from assembl.auth import P_READ, P_ADD_EXTRACT
from assembl.auth.util import user_has_permission
from assembl.lib import config as AssemblConfig
from assembl.graphql.schema import Schema


@view_config(request_method='GET, POST', route_name='graphql')
def graphql_api(request):
    solver = graphql_wsgi(Schema)
    # Authentication
    user_id = authenticated_userid(request) or Everyone
    if not user_id:
        return HTTPNotFound

    return solver(request)


#TODO: Add graphql support
# def graphiql_view(request):
#     pass