import json
import os

from pyramid.view import view_config
from assembl.views.api import FIXTURE_DIR
from assembl.db import DBSession

from assembl.source.models import Post
from assembl.synthesis.models import Discussion

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

    from time import sleep
    sleep(1)

    return data


@view_config(renderer='json', route_name='get_posts', request_method='GET', http_cache=60)
def get_posts(request):
    try:
        root_post_id = int(request.GET.getone('id'))
    except (ValueError, KeyError):
        root_post_id = None
        
    query = DBSession.query(Post)
    #if root_post_id:
        #query=query.get(root_post_id)
    
    #path = os.path.join(FIXTURE_DIR, 'posts.json')
    #f = open(path)
    #data = json.loads(f.read())
    #f.close()
    retval = []
    for post in query:
        data = {}
        data["id"] = post.id
        
        data["checked"] = False
        #FIXME
        data["collapsed"] = True
        #FIXME
        data["read"] = True
        data["parentId"] = post.parent_id
        data["subject"] = post.title
        data["body"] = post.body
        data["authorName"] = post.author
        #FIXME
        data["avatarUrl"] = None
        data["date"] = post.creation_date
        retval.append(data)
    return retval


# Update
@view_config(renderer='json', route_name='save_post', request_method='PUT', http_cache=60)
def save_post(request):
    data = json.loads(request.body)

    return data
