import os
import json

from pyramid.view import view_config
from assembl.views.api import FIXTURE_DIR


# Create
@view_config(renderer='json', route_name='create_segment', request_method='POST', http_cache=60)
def create_segment(request):
    # data = json.loads(request.body)

    import time
    return {'id': int(time.time())}


# Retrieve
@view_config(renderer='json', route_name='get_segment', request_method='GET', http_cache=60)
def get_segment(request):
    id = request.matchdict['id']
    return {'id': id, 'text': 'from server'}


@view_config(renderer='json', route_name='get_segments', request_method='GET', http_cache=60)
def get_segments(request):
    path = os.path.join(FIXTURE_DIR, 'segments.json')
    f = open(path)
    data = json.loads(f.read())
    f.close()

    return data


# Update
@view_config(renderer='json', route_name='save_segment', request_method='PUT', http_cache=60)
def save_segment(request):
    data = json.loads(request.body)

    return data


# Delete
@view_config(renderer='json', route_name='delete_segment', request_method='DELETE', http_cache=60)
def delete_segment(request):
    #data = json.loads(request.body)

    return {'ok': True}
