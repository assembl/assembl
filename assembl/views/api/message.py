import json
import os

from pyramid.view import view_config
from assembl.views.api import FIXTURE_DIR


# Retrieve
@view_config(renderer='json', route_name='get_inbox', request_method='GET', http_cache=60)
def get_inbox(request):
    path = os.path.join(FIXTURE_DIR, 'inbox.json')
    f = open(path)
    data = json.loads(f.read())
    f.close()

    try:
        page = int(request.GET.getone('page'))
    except (ValueError, KeyError):
        page = 1

    if page < 1:
        page = 1

    data["page"] = page
    data["maxPage"] = 9
    data["inbox"] = 253
    data["total"] = 437
    data["startIndex"] = (50 * page) - 49
    data["endIndex"] = data["startIndex"] + 49

    if data["page"] == data["maxPage"]:
        data["endIndex"] = data["total"]

    return data


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
