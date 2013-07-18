import json
import os

from pyramid.view import view_config
from assembl.views.api import FIXTURE_DIR


# Retrieve
@view_config(renderer='json', route_name='get_messages', request_method='GET', http_cache=60)
def get_messages(request):
    path = os.path.join(FIXTURE_DIR, 'messages.json')
    f = open(path)
    data = json.loads(f.read())
    f.close()

    return data


# Update
@view_config(renderer='json', route_name='save_message', request_method='PUT', http_cache=60)
def save_message(request):
    data = json.loads(request.body)

    return data
