from pyramid.view import view_config, view_defaults

from ...api.post import PostAPI


@view_defaults(renderer='json', request_method='GET', http_cache=0)
class PostView(object):
    def __init__(self, request):
        self.req = request
        self.md = request.matchdict
        self.api = PostAPI()

    @view_config(route_name='api.post.create', request_method='POST')
    def create(self):
        return dict(self.api.create(**self.req.POST).iteritems())

    @view_config(route_name='api.post.get', http_cache=60)
    def get(self):
        return dict(self.api.get(**self.md).iteritems())

    @view_config(route_name='api.post.update', request_method='POST')
    def update(self):
        post = self.api.get(**self.md)
        return dict(self.api.update(obj=post,
                                    fields=self.req.POST).iteritems())

    @view_config(route_name='api.post.delete')
    def delete(self, **criteria):
        return dict(result=self.api.delete(**self.md))
