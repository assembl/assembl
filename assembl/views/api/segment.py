import json

from pyramid.view import view_config


# Create
@view_config(renderer='json', route_name='create_segment', request_method='POST', http_cache=60)
def create_segment(request):
    #data = json.loads(request.body)

    import time
    return {'id': int(time.time())}


# Retrieve
@view_config(renderer='json', route_name='get_segment', request_method='GET', http_cache=60)
def get_segment(request):
    id = request.matchdict['id']
    return {'id': id, 'shortTitle': 'from server'}


@view_config(renderer='json', route_name='get_segments', request_method='GET', http_cache=60)
def get_segments(request):
    id = request.matchdict['id']
    return {'id': id, 'shortTitle': 'from server'}


# Update
@view_config(renderer='json', route_name='save_segment', request_method='PUT', http_cache=60)
def save_segment(request):
    data = json.loads(request.body)

    return data

# Delete
# WE DON'T DELETE IDEAS. LIVE WITH IT
