from pyramid.view import view_config
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone
from pyramid.request import Response
from graphql_wsgi import graphql_wsgi as graphql_wsgi_wrapper
from graphql.execution.middleware import MiddlewareManager

from assembl.auth import CrudPermissions
from assembl.auth.util import get_permissions
from assembl.auth.util import find_discussion_from_slug
from assembl.graphql.schema import Schema
from assembl.lib.logging import getLogger
from assembl.lib.sqla import get_session_maker


class LoggingMiddleware(object):
    def resolve(self, next, source, gargs, context, info, *args, **kwargs):
        log = getLogger()
        if source is None:
            modified_variables = {}
            for key, value in info.variable_values.items():
                if 'password' in key or 'Password' in key:
                    modified_variables[key] = 'xxxxxxxxxxxxx'
                else:
                    modified_variables[key] = value
            log.debug(
                'graphql', op=info.operation.operation,
                opname=info.operation.name.value, vars=modified_variables)
        try:
            return next(source, gargs, context, info, *args, **kwargs)
        except Exception as e:
            log.error("graphql_error", exc_info=True)
            raise e


class ReadOnlyMiddleware(object):
    def resolve(self, next, source, gargs, context, info, *args, **kwargs):
        session = get_session_maker()()
        ro = session.readonly
        if info.operation.operation == 'query' and info.operation.name.value != u'Post':
            # Post query has a side-effect with maybe_translate so it requires a db write.
            session.set_readonly()
        try:
            return next(source, gargs, context, info, *args, **kwargs)
        finally:
            session.set_readonly(ro)


# Only allow POST+OPTIONS (query may be GET, but mutations should always be a POST,
# but there is no such check for now in graphql-wsgi)
@view_config(request_method='POST', route_name='graphql')
@view_config(request_method='OPTIONS', route_name='graphql')
def graphql_api(request):
    slug = request.matchdict['discussion_slug']
    # Check permission
    discussion = find_discussion_from_slug(slug)
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
    if request.content_type == 'application/json' and u'query' in request.json_body and (
        request.json_body['query'].startswith(u'query TextFields(') or
            request.json_body['query'].startswith(u'query UpdateShareCount(') or
            request.json_body['query'].startswith(u'query TabsCondition(') or
            request.json_body['query'].startswith(u'query LegalContents(') or
            request.json_body['query'].startswith(u'query DiscussionPreferences')):
        check_read_permission = False

    if check_read_permission and not discussion.user_can(user_id, CrudPermissions.READ, permissions):
        raise HTTPUnauthorized()

    middleware = MiddlewareManager(
        LoggingMiddleware(), ReadOnlyMiddleware(), wrap_in_promise=False)
    solver = graphql_wsgi_wrapper(Schema, middleware=middleware)
    response = solver(request)
    if has_cors:
        response.headerlist.extend(cors_headers)
    return response
