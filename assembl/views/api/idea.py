import json
import os

from pyramid.view import view_config, view_defaults


# Create
@view_config(renderer='json', route_name='create_idea', request_method='POST', http_cache=60)
def create_idea(request):
    #data = json.loads(request.body)

    import time
    return { 'id' : int(time.time()) }

# Retrieve
@view_config(renderer='json', route_name='get_idea', request_method='GET', http_cache=60)
def get_idea(request):
    id = request.matchdict['id']
    return {'id': id, 'shortTitle': 'from server'}

@view_config(renderer='json', route_name='get_ideas', request_method='GET', http_cache=60)
def get_ideas(request):
    id = request.matchdict['id']
    return {'id': id, 'shortTitle': 'from server'}

# Update
@view_config(renderer='json', route_name='save_idea', request_method='PUT', http_cache=60)
def save_idea(request):
    data = json.loads(request.body)
    print data
    return data

# Delete
# WE DON'T DELETE IDEAS. LIVE WITH IT