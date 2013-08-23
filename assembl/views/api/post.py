import json
import os


from math import ceil
from cornice import Service
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPNotFound, HTTPUnauthorized
from pyramid.i18n import TranslationString as _
from pyramid.security import Allow, Everyone, authenticated_userid


from assembl.views.api import API_PREFIX
from assembl.db import DBSession

from assembl.source.models import Post
from assembl.synthesis.models import Discussion, Source, Content


POST_ACL = [
    (Allow, 'r:participant', 'write'),
    (Allow, 'r:moderator', 'delete'),
    (Allow, 'r:admin', 'delete')
]


posts = Service(name='posts', path=API_PREFIX + '/posts',
                description="Post API following SIOC vocabulary as much as possible",
                renderer='json', acl=lambda req: POST_ACL)

post = Service(name='post', path=API_PREFIX + '/posts/{id}',
               description="Manipulate a single post",
               acl=lambda req: POST_ACL)


def __post_to_json_structure(post):
    data = {}
    data["id"] = post.id
    
    data["checked"] = False
    #FIXME
    data["collapsed"] = True
    #FIXME
    data["read"] = True
    data["parentId"] = post.parent_id
    data["subject"] = post.content.subject
    data["body"] = post.content.body
    data["authorName"] = post.content.sender
    #FIXME
    data["avatarUrl"] = None
    data["date"] = post.content.creation_date.isoformat()
    return data


@posts.get()
def get_posts(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = DBSession.query(Discussion).get(discussion_id)
    if not discussion:
        raise HTTPNotFound(_("No discussion found with id=%s" % discussion_id))

    DEFAULT_PAGE_SIZE = 25
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

    if root_post_id == 0:
        root_post_id = None

    data = {}
    data["page"] = page

    #Rename "inbox" to "unread", the number of unread messages for the current user.
    data["inbox"] = discussion.total_posts()
    #What is "total", the total messages in the current context?
    data["total"] = discussion.total_posts()
    data["maxPage"] = max(1, ceil(float(data["total"])/page_size))
    #TODO:  Check if we want 1 based index in the api
    data["startIndex"] = (page_size * page) - (page_size-1)


    if data["page"] == data["maxPage"]:
        data["endIndex"] = data["total"]
    else:
        data["endIndex"] = data["startIndex"] + (page_size-1)
        
    post_data = []

    if root_post_id: 
        post_data.append(
            __post_to_json_structure(DBSession.query(Post).get(root_post_id))
        )

    posts = discussion.posts(parent_id=root_post_id)
    posts = posts.limit(page_size).offset(data['startIndex']-1)

    for post in posts:
        post_data.append(__post_to_json_structure(post))

        for descendant in post.get_descendants():
            post_data.append(__post_to_json_structure(descendant))
    data["posts"] = post_data

    return data


@posts.post()
def create_post(request):
    """
    We use post, not put, because we don't know the id of the post
    """
    request_body = json.loads(request.body)
    user_id = authenticated_userid(request)

    message = request_body.get('message', None)
    reply_id = request_body.get('reply_id', None)

    if not user_id:
        raise HTTPUnauthorized()

    user = DBSession.query(User).get(user_id)

    if not message:
        raise HTTPUnauthorized()

    if reply_id:
        post = DBSession.query(Post).get(int(reply_id))
        post.content.reply(user, post_body['message'])

        return { "ok": True }

    discussion_id = request.matchdict['discussion_id']
    discussion = DBSession.query(Discussion).get(discussion_id)

    if not discussion:
        raise HTTPNotFound(
            _("No discussion found with id=%s" % discussion_id)
        )

    for source in discussion.sources:
        source.send(user, message)

    return { "ok": True }
