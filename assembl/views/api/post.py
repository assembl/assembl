from colander import Invalid
from cornice import Service
from sqlalchemy.orm.exc import NoResultFound

from pyramid.view import view_config, view_defaults
from pyramid.response import Response

from .. import cornice_paths
from ...api import post as api


desc = 'An API to manipulate posts.'
posts_svc = Service(name='posts', path=cornice_paths['posts'],
                    description=desc, renderer='json')
post_svc = Service(name='post', path=cornice_paths['post'],
                   description=desc, renderer='json')


@view_config(context=NoResultFound)
def notfound(exc, request):
    return Response('<h1>404 Not Found</h1>The resource could not be found',
                    status='404 Not Found')


@view_config(context=Invalid)
def failed_validation(exc, request):
    response =  Response('Validation failed')
    response.status_int = 400
    return response


def validate(fields, **kwargs):
    if 'include' not in kwargs and 'exclude' not in kwargs:
        kwargs['include'] = fields.keys()
    return api.validator(**kwargs).deserialize(fields)


@posts_svc.get()
def list_posts(request):
    id = request.GET.get('start', None)

    if id is not None:
        levels = request.GET.get('levels', None)
        posts = api.get_thread(int(id), int(levels) if levels else None)
    else:
        posts = api.list()

    return [dict(p) for p in posts]


@posts_svc.post()
def create_post(request):
    fields = validate(dict(request.POST), include='__nopk__',
                      exclude=['message_id'])
    return dict(api.create(**fields))


@post_svc.get()
def get_post(request):
    criteria = validate(request.matchdict)
    return dict(api.get(**criteria))


@post_svc.post()
def update_post(request):
    criteria = validate(request.matchdict)
    post = api.get(**criteria)
    post.update(**validate(dict(request.POST)))
    return dict(post)


@post_svc.delete()
def delete_post(request):
    criteria = validate(request.matchdict)
    api.get(**criteria).delete()
    return dict(result=True)
