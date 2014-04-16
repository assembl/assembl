import os
import json

from pyramid.view import view_config

from .. import acls
from ..traversal import InstanceContext, CollectionContext, ClassContext
from assembl.auth import P_READ,P_SYSADMIN

FIXTURE_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', 'static', 'js', 'tests', 'fixtures')
API_PREFIX = '/data/'


def includeme(config):
    """ Initialize views and renderers at app start-up time. """
    config.add_route('csrf_token2', 'Token')


@view_config(context=ClassContext, renderer='json', request_method='GET', permission=P_READ)
def class_view(request):
    ctx = request.context
    view = (request.matchdict or {}).get('view', None) or '/id_only'
    view = view[1:]
    q = ctx.create_query(view == 'id_only')
    if view == 'id_only':
        return [ctx._class.uri_generic(x) for (x,) in q.all()]
    else:
        return [i.generic_json(view) for i in q.all()]


@view_config(context=InstanceContext, renderer='json', request_method='GET', permission=P_READ)
def instance_view(request):
    ctx = request.context
    view = (request.matchdict or {}).get('view', None) or '/default'
    view = view[1:]
    return ctx._instance.generic_json(view)


@view_config(context=CollectionContext, renderer='json', request_method='GET', permission=P_READ)
def collection_view(request):
    ctx = request.context
    view = (request.matchdict or {}).get('view', None) or '/id_only'
    view = view[1:]
    q = ctx.create_query(view == 'id_only')
    if view == 'id_only':
        return [ctx.collection_class.uri_generic(x) for (x,) in q.all()]
    else:
        return [i.generic_json(view) for i in q.all()]
