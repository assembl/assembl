import json
import os

from math import ceil
from cornice import Service
from pyramid.view import view_config
from assembl.views.api import FIXTURE_DIR
from assembl.db import DBSession

from assembl.source.models import Post
from assembl.synthesis.models import Discussion

posts = Service(name='posts', path='/api/posts',
                 description="Post API following SIOC vocabulary as much as possible",
                 renderer='json')
post = Service(name='post', path='/api/posts/{id}',
                 description="Manipulate a single post")

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
    data["date"] = post.creation_date.isoformat()
    return data

@posts.get()
def get_posts(request):
    
    DEFAULT_PAGE_SIZE = 50
    page_size = DEFAULT_PAGE_SIZE
    try:
        page = int(request.GET.getone('page'))
    except (ValueError, KeyError):
        page = 1

    if page < 1:
        page = 1
        
    try:
        root_post_id = int(request.GET.getone('root_post_id'))
    except (ValueError, KeyError):
        root_post_id = None
        
    
    
    
    if root_post_id:
        root = DBSession.query(Post).get(root_post_id)
        base_query = root.get_descendants(include_self=True)
    else:
        base_query = DBSession.query(Post)

    
    data = {}
    data["page"] = page

    #What is "inbox", the number of new messages?
    data["inbox"] = 666
    #What is "total", the total messages in the current context?
    data["total"] = base_query.count()
    data["maxPage"] = ceil(float(data["total"])/page_size)
    #TODO:  Check if we want 1 based index in the api
    data["startIndex"] = (page_size * page) - (page_size-1)


    if data["page"] == data["maxPage"]:
        data["endIndex"] = data["total"]
    else:
        data["endIndex"] = data["startIndex"] + (page_size-1)
        
    post_data = []
    query = base_query.limit(page_size).offset(data["startIndex"]-1)
    for post in query:
        post_data.append(_get_json_structure_from_post(post))
    data["posts"] = post_data

    return data


# Update
#@view_config(renderer='json', route_name='save_post', request_method='PUT', http_cache=60)
#def save_post(request):
#    data = json.loads(request.body)

#    return data
