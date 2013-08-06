import json
import os

from math import ceil
from pyramid.view import view_config
from assembl.views.api import FIXTURE_DIR
from assembl.db import DBSession

from assembl.source.models import Post
from assembl.synthesis.models import Discussion

# Retrieve
@view_config(renderer='json', route_name='get_inbox', request_method='GET', http_cache=60)
def get_inbox(request):
    PAGE_SIZE = 50

    try:
        page = int(request.GET.getone('page'))
    except (ValueError, KeyError):
        page = 1

    if page < 1:
        page = 1

    base_query = DBSession.query(Post)
    data = {}
    data["page"] = page

    #What is "inbox", the number of new messages?
    data["inbox"] = 666
    #What is "total", the total messages in the current context?
    data["total"] = base_query.count()
    data["maxPage"] = ceil(float(data["total"])/PAGE_SIZE)
    #TODO:  Check if we want 1 based index in the api
    data["startIndex"] = (PAGE_SIZE * page) - (PAGE_SIZE-1)


    if data["page"] == data["maxPage"]:
        data["endIndex"] = data["total"]
    else:
        data["endIndex"] = data["startIndex"] + (PAGE_SIZE-1)
        
    post_data = []
    query = base_query.limit(PAGE_SIZE).offset(data["startIndex"]-1)
    for post in query:
        post_data.append(_get_json_structure_from_post(post))
    data["messages"] = post_data

    return data

def _get_json_structure_from_post(post):
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
    return data

@view_config(renderer='json', route_name='get_posts', request_method='GET', http_cache=60)
def get_posts(request):
    try:
        root_post_id = int(request.GET.getone('id'))
    except (ValueError, KeyError):
        root_post_id = None
        
    
    if root_post_id:
        root = DBSession.query(Post).get(root_post_id)
        posts = root.get_descendants(include_self=True)
    else:
        posts = DBSession.query(Post).all()
    
    retval = []
    for post in posts:
        retval.append(_get_json_structure_from_post(post))
    return retval


# Update
@view_config(renderer='json', route_name='save_post', request_method='PUT', http_cache=60)
def save_post(request):
    data = json.loads(request.body)

    return data
