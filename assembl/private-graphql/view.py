from pyramid.view import view_config
from graphql_wsgi import graphql_wsgi as graphql_wsgi_wrapper

from .schema import Schema


@view_config(route_name='private-graphql', request_method='POST')
def private_graphql_view(request):
    solver = graphql_wsgi_wrapper(Schema)
    return solver(request)
