import json
import os

from pyramid.view import view_config
from assembl.views.api import FIXTURE_DIR


# Create
@view_config(renderer='json', route_name='create_idea', request_method='POST', http_cache=60)
def create_idea(request):
    #data = json.loads(request.body)

    import time
    return {'id': int(time.time())}


# Retrieve
@view_config(renderer='json', route_name='get_idea', request_method='GET', http_cache=60)
def get_idea(request):
    id = request.matchdict['id']
    return {'id': id, 'shortTitle': 'from server'}


@view_config(renderer='json', route_name='get_ideas', request_method='GET', http_cache=60)
def get_ideas(request):
    path = os.path.join(FIXTURE_DIR, 'ideas.json')
    f = open(path)
    data = json.loads(f.read())
    f.close()

    return data


# Update
@view_config(renderer='json', route_name='save_idea', request_method='PUT', http_cache=60)
def save_idea(request):
    data = json.loads(request.body)

    return data

# Delete
# WE DON'T DELETE IDEAS. LIVE WITH IT
