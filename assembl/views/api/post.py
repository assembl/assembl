from colander import Invalid
from sqlalchemy.orm.exc import NoResultFound

from pyramid.view import view_config, view_defaults
from pyramid.response import Response

from ...api import post as api


@view_config(context=NoResultFound)
def notfound(exc, request):
    return Response('<h1>404 Not Found</h1>The resource could not be found',
                    status='404 Not Found')


@view_config(context=Invalid)
def failed_validation(exc, request):
    response =  Response('Validation failed')
    response.status_int = 400
    return response


@view_defaults(renderer='json', request_method='GET', http_cache=0)
class PostAPIView(object):
    """API web gateway to posts."""
    def __init__(self, request):
        self.request = request

    def validate(self, fields, **kwargs):
        if 'include' not in kwargs and 'exclude' not in kwargs:
            kwargs['include'] = fields.keys()
        return api.validator(**kwargs).deserialize(fields)

    @view_config(route_name='api.post.list', http_cache=60)
    def list(self):
        return dict(posts=[dict(p) for p in api.list()])

    @view_config(route_name='api.post.list', request_method='POST')
    def create(self):
        fields = self.validate(dict(self.request.POST), include='__nopk__',
                               exclude=['message_id'])
        return dict(api.create(**fields))

    @view_config(route_name='api.post.item', http_cache=60)
    def get(self):
        criteria = self.validate(self.request.matchdict)
        return dict(api.get(**criteria))

    @view_config(route_name='api.post.item', request_method='PUT')
    def update(self):
        criteria = self.validate(self.request.matchdict)
        post = api.get(**criteria)
        post.update(**self.validate(dict(self.request.POST)))
        return dict(post)

    @view_config(route_name='api.post.item', request_method='DELETE')
    def delete(self):
        criteria = self.validate(self.request.matchdict)
        api.get(**criteria).delete()
        return dict(result=True)
