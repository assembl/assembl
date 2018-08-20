from pyramid.view import view_config
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone
from pyramid.request import Response
from graphql_wsgi import graphql_wsgi as graphql_wsgi_wrapper
from graphql_wsgi.main import get_graphql_params as original_get_graphql_params
import graphql_wsgi.main

from assembl import models
from assembl.auth import CrudPermissions
from assembl.auth.util import get_permissions
from assembl.graphql.schema import Schema
from assembl.lib.logging import getLogger


class LoggingMiddleware(object):
    def resolve(self, next, source, gargs, context, info, *args, **kwargs):
        if source is None:
            modified_variables = {}
            for key, value in info.variable_values.items():
                if 'password' in key or 'Password' in key:
                    modified_variables[key] = 'xxxxxxxxxxxxx'
                else:
                    modified_variables[key] = value

            getLogger().debug(
                'graphql', op=info.operation.operation,
                opname=info.operation.name.value, vars=modified_variables)
        return next(source, gargs, context, info, *args, **kwargs)


def get_graphql_params(request, data):
    query, variables, operation_name = original_get_graphql_params(request, data)
    modified_variables = {}
    if variables is not None:
        for key, value in variables.items():
            if 'password' in key or 'Password' in key:
                modified_variables[key] = 'xxxxxxxxxxxxx'
            else:
                modified_variables[key] = value

    operation = query.split()[0]
    getLogger().debug(
        'graphql', op=operation,
        opname=operation_name, vars=modified_variables)

    return query, variables, operation_name


# monkey patch get_graphql_params for logging
graphql_wsgi.main.get_graphql_params = get_graphql_params


# Only allow POST+OPTIONS (query may be GET, but mutations should always be a POST,
# but there is no such check for now in graphql-wsgi)
@view_config(request_method='POST', route_name='graphql')
@view_config(request_method='OPTIONS', route_name='graphql')
def graphql_api(request):
    slug = request.matchdict['discussion_slug']
    # Check permission
    discussion = models.Discussion.query.filter(
        models.Discussion.slug == slug).one()
    if discussion is None:
        raise HTTPUnauthorized()

    # Check if this discussion has CORS enabled
    cors_pref = discussion.preferences['graphql_valid_cors']
    has_cors = cors_pref and len(cors_pref) > 0
    cors_string = str(",".join(cors_pref))
    cors_headers = [
        ('Access-Control-Allow-Origin', cors_string),
        ('Access-Control-Allow-Headers', 'Content-Type, Cookie'),
        ('Access-Control-Allow-Methods', 'POST, OPTIONS')
    ]
    # Response for preflight-CORS requests
    # No authentication needed
    if has_cors:
        if request.method == 'OPTIONS':
            response = Response(status=200, body=b'')
            response.headerlist = []
            response.headerlist.extend(cors_headers)
            return response

    discussion_id = discussion.id
    # set discussion_id in request.matchdict which is use as context_value
    request.matchdict['discussion_id'] = discussion_id
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(user_id, discussion_id)
    # don't check read permission for TextFields query needed on the signup
    # page because we don't have read permission on private debate
    check_read_permission = True
    if request.content_type == 'application/json' and u'query' in request.json_body and request.json_body['query'].startswith(u'query TextFields('):
        check_read_permission = False

    if check_read_permission and not discussion.user_can(user_id, CrudPermissions.READ, permissions):
        raise HTTPUnauthorized()

    # Using a middleware transforms the request to a promise that
    # doesn't play nice with multiprocesses or multithreading and sqlalchemy session.
    # We monkey patch get_graphql_params for logging instead.
    solver = graphql_wsgi_wrapper(Schema)  # , middleware=[LoggingMiddleware()])
    response = solver(request)
    if has_cors:
        response.headerlist.extend(cors_headers)
    return response
