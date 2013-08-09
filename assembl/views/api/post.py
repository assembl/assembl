import json
import os


from math import ceil
from cornice import Service
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPNotFound
from pyramid.i18n import TranslationString as _
from assembl.views.api import FIXTURE_DIR
from assembl.db import DBSession

from assembl.source.models import Post
from assembl.synthesis.models import Discussion

posts = Service(name='posts', path='/api/posts',
                 description="Post API following SIOC vocabulary as much as possible",
                 renderer='json')
post = Service(name='post', path='/api/posts/{id}',
                 description="Manipulate a single post")

def __post_to_json_structure(post):
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
        if not root:
            raise HTTPNotFound(_("No Post found with id=%d" % root_post_id))
        base_query = root.get_descendants(include_self=True)
    else:
        base_query = DBSession.query(Post)

    
    data = {}
    data["page"] = page

    #Rename "inbox" to "unread", the number of unread messages for the current user.
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
        post_data.append(__post_to_json_structure(post))
    data["posts"] = post_data

    return data

@posts.post()
def create_post(request):
    """
    We use post, not put, because we don't know the IP of the 
    """
    if False:  #TODO:  Check that the object doesn't exist already
        raise Forbidden()
    data = json.loads(request.body)
    return data
