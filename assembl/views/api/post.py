import json
import os
import transaction

from math import ceil
from cornice import Service
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPNotFound, HTTPUnauthorized
from pyramid.i18n import TranslationString as _
from pyramid.security import Allow, Everyone, authenticated_userid


from assembl.views.api import API_PREFIX
from assembl.db import DBSession

from assembl.source.models import Post
from assembl.synthesis.models import Discussion, Source, Content, Extract, Idea
from assembl.auth.models import ViewPost

from sqlalchemy.orm import aliased
from sqlalchemy.orm.exc import NoResultFound

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
    data["collapsed"] = False
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

def _get_idea_query():
    """Return a query that includes the post and its following thread.


    Beware: we use a recursive query via a CTE and the PostgreSQL-specific
    ARRAY type. Blame this guy for that choice:
    http://explainextended.com/2009/09/24/adjacency-list-vs-nested-sets-postgresql/

    Also, that other guy provided insight into using CTE queries:
    http://stackoverflow.com/questions/11994092/how-can-i-perform-this-recursive-common-table-expression-in-sqlalchemy

    A literal column and an op complement nicely all this craziness.

    All I can say is SQLAlchemy kicks ass, and so does PostgreSQL.

    """
    level = literal_column('ARRAY[id]', type_=ARRAY(Integer))
    post = self.db.query(self.__class__) \
                  .add_columns(level.label('level')) \
                  .filter(self.__class__.id == self.id) \
                  .cte(name='thread', recursive=True)
    post_alias = aliased(post, name='post')
    replies_alias = aliased(self.__class__, name='replies')
    cumul_level = post_alias.c.level.op('||')(replies_alias.id)
    parent_link = replies_alias.parent_id == post_alias.c.id
    children = self.db.query(replies_alias).add_columns(cumul_level) \
                      .filter(parent_link)

    if levels:
        level_limit = func.array_upper(post_alias.c.level, 1) < levels
        children = children.filter(level_limit)

    return self.db.query(post.union_all(children)).order_by(post.c.level)

@posts.get()
def get_posts(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = DBSession.query(Discussion).get(discussion_id)
    if not discussion:
        raise HTTPNotFound(_("No discussion found with id=%s" % discussion_id))

    user_id = authenticated_userid(request)

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

    try:
        root_idea_id = int(request.GET.getone('root_idea_id'))
    except (ValueError, KeyError):
        root_idea_id = None

    data = {}
    data["page"] = page

    #Rename "inbox" to "unread", the number of unread messages for the current user.
    no_of_messages_viewed_by_user = DBSession.query(ViewPost).filter_by(
        actor_id=user_id,
    ).count() if user_id else 0

    data["inbox"] = discussion.posts().count() - no_of_messages_viewed_by_user
    #What is "total", the total messages in the current context?
    data["total"] = discussion.posts().count()
    data["maxPage"] = max(1, ceil(float(data["total"])/page_size))
    #TODO:  Check if we want 1 based index in the api
    data["startIndex"] = (page_size * page) - (page_size-1)


    if data["page"] == data["maxPage"]:
        data["endIndex"] = data["total"]
    else:
        data["endIndex"] = data["startIndex"] + (page_size-1)
        
    post_data = []

    if root_idea_id:
        ideas_query = DBSession.query(Post) \
        .from_statement("""
WITH    RECURSIVE
idea_dag(idea_id, parent_id, idea_depth, idea_path, idea_cycle) AS
(
SELECT  id as idea_id, parent_id, 1, ARRAY[idea_initial.id], false 
FROM    idea AS idea_initial LEFT JOIN idea_association ON (idea_initial.id = idea_association.child_id) 
WHERE id=:root_idea_id
UNION ALL
SELECT idea.id as idea_id, idea_association.parent_id, idea_dag.idea_depth + 1, idea_path || idea.id, idea.id = ANY(idea_path)
FROM    (idea_dag JOIN idea_association ON (idea_dag.idea_id = idea_association.parent_id) JOIN idea ON (idea.id = idea_association.child_id)) 
)
SELECT DISTINCT post.id FROM idea_dag 
JOIN extract ON (extract.idea_id = idea_dag.idea_id) 
JOIN content ON (extract.source_id = content.id) 
JOIN post AS root_posts ON (root_posts.content_id = content.id) JOIN post ON ((post.ancestry LIKE '%' || root_posts.ancestry || root_posts.id || ',') OR post.id = root_posts.id)
""") \
        .params(root_idea_id=root_idea_id)
        posts = ideas_query.all()
    else:
        if root_post_id: 
            post_data.append(
            __post_to_json_structure(DBSession.query(Post).get(root_post_id))
            )

        posts = discussion.posts(parent_id=root_post_id)
        posts = posts.limit(page_size).offset(data['startIndex']-1)

    for post in posts:
        serializable_post = __post_to_json_structure(post)
        post_data.append(serializable_post)

        if not root_idea_id:
            for descendant in post.get_descendants():
                post_data.append(__post_to_json_structure(descendant))
    data["posts"] = post_data

    if user_id:
        for serializable_post in data['posts']:
            try:
                DBSession.query(ViewPost).filter_by(
                    actor_id=user_id,
                    post_id=serializable_post['id']
                ).one()
                serializable_post['read'] = True

            except NoResultFound:
                serializable_post['read'] = False
                if root_post_id:
                    with transaction.manager:
                        viewed_post = ViewPost(
                            actor_id=user_id,
                            post_id=serializable_post['id']
                        )

                        DBSession.add(viewed_post)

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
