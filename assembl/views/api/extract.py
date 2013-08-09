import os
import json

from cornice import Service
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPNotFound
from pyramid.i18n import TranslationString as _
from assembl.views.api import FIXTURE_DIR
from assembl.synthesis.models import Extract

extracts = Service(name='extracts', path='/api/extracts',
                 description="Post API following SIOC vocabulary as much as possible",
                 renderer='json')
extract = Service(name='extract', path='/api/extracts/{id}',
                 description="Manipulate a single post")
# Create
@view_config(renderer='json', route_name='create_extract', request_method='POST', http_cache=60)
def create_extract(request):
    data = json.loads(request.body)

    return data


# Retrieve
@view_config(renderer='json', route_name='get_extract', request_method='GET', http_cache=60)
def get_extract(request):
    id = request.matchdict['id']
    return {'id': id, 'text': 'from server'}


@view_config(renderer='json', route_name='get_extracts', request_method='GET', http_cache=60)
def get_extracts(request):
    path = os.path.join(FIXTURE_DIR, 'extracts.json')
    f = open(path)
    data = json.loads(f.read())
    f.close()

    return data


# Update
@view_config(renderer='json', route_name='save_extract', request_method='PUT', http_cache=60)
def save_extract(request):
    data = json.loads(request.body)

    return data


# Delete
@view_config(renderer='json', route_name='delete_extract', request_method='DELETE', http_cache=60)
def delete_extract(request):
    #data = json.loads(request.body)

    return {'ok': True}
