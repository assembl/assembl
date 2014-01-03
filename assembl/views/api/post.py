import json

from math import ceil
from cornice import Service
from pyramid.httpexceptions import HTTPNotFound, HTTPUnauthorized
from pyramid.i18n import TranslationString as _
from pyramid.security import authenticated_userid

from sqlalchemy import func, Integer, String, text
from sqlalchemy.dialects.postgresql.base import ARRAY

from sqlalchemy.orm import aliased, joinedload, joinedload_all, contains_eager
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql.expression import literal_column, bindparam, and_
from sqlalchemy.sql import cast

from assembl.views.api import API_DISCUSSION_PREFIX
import transaction

from assembl.auth import P_READ, P_ADD_POST
from assembl.models import (
    get_database_id, get_named_object, AgentProfile, Post, AssemblPost, SynthesisPost, 
    Synthesis, Discussion, PostSource, Content, Idea, ViewPost, User)
from . import acls
import uuid

posts = Service(name='posts', path=API_DISCUSSION_PREFIX + '/posts',
                description="Post API following SIOC vocabulary as much as possible",
                renderer='json', acl=acls)

post = Service(name='post', path=API_DISCUSSION_PREFIX + '/posts/{id:.+}',
               description="Manipulate a single post",
               acl=acls)

post_read = Service(name='post_read', path=API_DISCUSSION_PREFIX + '/post_read/{id:.+}',
               description="Signal that a post was read",
               acl=acls)

def _get_idea_query(post, levels=None):
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
    post = Post.db.query(post.__class__) \
                    .add_columns(level.label('level')) \
                    .filter(post.__class__.id == post.id) \
                    .cte(name='thread', recursive=True)
    post_alias = aliased(post, name='post')
    replies_alias = aliased(post.__class__, name='replies')
    cumul_level = post_alias.c.level.op('||')(replies_alias.id)
    parent_link = replies_alias.parent_id == post_alias.c.id
    children = Post.db.query(replies_alias).add_columns(cumul_level) \
                        .filter(parent_link)

    if levels:
        level_limit = func.array_upper(post_alias.c.level, 1) < levels
        children = children.filter(level_limit)

    return Post.db.query(post.union_all(children)).order_by(post.c.level)


@posts.get(permission=P_READ)
def get_posts(request):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get(id=int(discussion_id))
    if not discussion:
        raise HTTPNotFound(_("No discussion found with id=%s" % discussion_id))

    discussion.import_from_sources()

    user_id = authenticated_userid(request)

    DEFAULT_PAGE_SIZE = 25
    page_size = DEFAULT_PAGE_SIZE

    filter_names = [ 
        filter_name for filter_name \
        in request.GET.getone('filters').split(',') \
        if filter_name
    ] if request.GET.get('filters') else []

    try:
        page = int(request.GET.getone('page'))
    except (ValueError, KeyError):
        page = 1

    if page < 1:
        page = 1

    root_post_id = request.GET.getall('root_post_id')
    if root_post_id:
        root_post_id = get_database_id("Post", root_post_id[0])

    root_idea_id = request.GET.getall('root_idea_id')
    if root_idea_id:
        root_idea_id = get_database_id("Idea", root_idea_id[0])

    ids = request.GET.getall('ids')
    if ids:
        ids = [get_database_id("Post", id) for id in ids]

    view_def = request.GET.get('view')


    #Rename "inbox" to "unread", the number of unread messages for the current user.
    no_of_messages_viewed_by_user = Post.db.query(ViewPost).join(
        Post
    ).filter(
        Post.discussion_id == discussion_id,
        ViewPost.actor_id == user_id,
    ).count() if user_id else 0

    if 'synthesis' in filter_names:
        posts = Post.db.query(SynthesisPost)
    else:
        posts = Post.db.query(Post)

    posts = posts.filter(
        Post.discussion_id == discussion_id,
    )
    no_of_posts_to_discussion = posts.count()

    post_data = []

        
    if root_idea_id:
        if root_idea_id == Idea.ORPHAN_POSTS_IDEA_ID:
            posts = posts \
                .filter(Post.id.in_(text(Idea._get_orphan_posts_statement(),
                                         bindparams=[bindparam('discussion_id', discussion_id)]
                                         )))
        else:
            posts = posts \
                .filter(Post.id.in_(text(Idea._get_related_posts_statement(),
                                         bindparams=[bindparam('root_idea_id', root_idea_id)]
                                         )))
    elif root_post_id:
        root_post = Post.get(id=root_post_id)

        posts = posts.filter(
            (Post.ancestry.like(
            root_post.ancestry + cast(root_post.id, String) + ',%'
            ))
            |
            (Post.id==root_post.id)
            )
        #Benoitg:  For now, this completely garbles threading without intelligent
        #handling of pagination.  Disabling
        #posts = posts.limit(page_size).offset(data['startIndex']-1)
    elif ids:
        posts = posts.filter(Post.id.in_(ids))

    if user_id:
        posts = posts.outerjoin(ViewPost,
                    and_(ViewPost.actor_id==user_id, ViewPost.post_id==Post.id)
                )
        posts = posts.add_entity(ViewPost)
    #posts = posts.options(contains_eager(Post.source))
    posts = posts.options(joinedload_all(Post.creator, AgentProfile.user))

    posts = posts.order_by(Content.creation_date)

    if user_id:
        for post, viewpost in posts:
            if view_def:
                serializable_post = post.generic_json(view_def)
            else:
                serializable_post = post.serializable()
            if viewpost:
                serializable_post['read'] = True
            else:
                serializable_post['read'] = False
                if root_post_id:
                    viewed_post = ViewPost(
                        actor_id=user_id,
                        post=post
                    )

                    Post.db.add(viewed_post)
            post_data.append(serializable_post)
    else:
        for post in posts:
            if view_def:
                serializable_post = post.generic_json(view_def)
            else:
                serializable_post = post.serializable()
            post_data.append(serializable_post)

    data = {}
    data["page"] = page
    data["inbox"] = no_of_posts_to_discussion - no_of_messages_viewed_by_user
    data["total"] = no_of_posts_to_discussion
    data["maxPage"] = max(1, ceil(float(data["total"])/page_size))
    #TODO:  Check if we want 1 based index in the api
    data["startIndex"] = (page_size * page) - (page_size-1)

    if data["page"] == data["maxPage"]:
        data["endIndex"] = data["total"]
    else:
        data["endIndex"] = data["startIndex"] + (page_size-1)
    data["posts"] = post_data

    return data


@post.get(permission=P_READ)
def get_post(request):
    post_id = request.matchdict['id']
    post = Post.get_instance(post_id)
    view_def = request.GET.get('view')

    if not post:
        raise HTTPNotFound("Post with id '%s' not found." % post_id)

    if view_def:
        return post.generic_json(view_def)
    else:
        return post.serializable()


@post_read.put(permission=P_READ)
def mark_post_read(request):
    post_id = request.matchdict['id']
    post = Post.get_instance(post_id)
    assert(post)
    user_id = authenticated_userid(request)
    if not user_id:
        raise HTTPUnauthorized()
    vp = ViewPost(post=post, actor_id=user_id)
    vp.db().merge(vp)
    return { "ok": True }


@posts.post(permission=P_ADD_POST)
def create_post(request):
    """
    We use post, not put, because we don't know the id of the post
    """
    request_body = json.loads(request.body)
    user_id = authenticated_userid(request)
    user = Post.db.query(User).filter_by(id=user_id).one()

    message = request_body.get('message', None)
    html = request_body.get('html', None)
    reply_id = request_body.get('reply_id', None)
    subject = request_body.get('subject', None)
    publishes_synthesis_id = request_body.get('publishes_synthesis_id', None)
    
    if not user_id:
        raise HTTPUnauthorized()

    if not message:
        raise HTTPUnauthorized()

    if reply_id:
        in_reply_to_post = Post.get_instance(reply_id)
    else:
        in_reply_to_post = None
    
    discussion_id = request.matchdict['discussion_id']
    discussion = Discussion.get_instance(discussion_id)

    if not discussion:
        raise HTTPNotFound(
            _("No discussion found with id=%s" % discussion_id)
        )

    post_constructor_args = {
        'discussion': discussion,
        'message_id': uuid.uuid1().urn,
        'creator_id': user_id,
        'subject': subject,
        'body': html if html else message
        }
    
    
    if publishes_synthesis_id:
        published_synthesis = Synthesis.get_instance(publishes_synthesis_id)
        post_constructor_args['publishes_synthesis'] = published_synthesis
        new_post = SynthesisPost(**post_constructor_args)
    else:
        new_post = AssemblPost(**post_constructor_args)
    
    #TODO benoitg:  Support replying to an idea
    subject = subject or ("Re: " + in_reply_to_post.subject if in_reply_to_post else None) or discussion.topic

    new_post.db.add(new_post)
    new_post.db.flush()
    print(repr(in_reply_to_post))
    if in_reply_to_post:
        new_post.set_parent(in_reply_to_post)

    for source in discussion.sources:
        source.send_post(new_post)

    return {"ok": True}
