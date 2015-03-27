import json

from math import ceil
from cornice import Service
from pyramid.httpexceptions import (
    HTTPNotFound, HTTPUnauthorized, HTTPBadRequest)
from pyramid.i18n import TranslationStringFactory

from pyramid.security import authenticated_userid

from sqlalchemy import String, text

from sqlalchemy.orm import (joinedload_all, undefer)
from sqlalchemy.sql.expression import bindparam, and_
from sqlalchemy.sql import cast, column

from assembl.views.api import API_DISCUSSION_PREFIX
import transaction

from assembl.auth import P_READ, P_ADD_POST
from assembl.auth.util import get_permissions
from assembl.models import (
    get_database_id, Post, AssemblPost, SynthesisPost,
    Synthesis, Discussion, Content, Idea, ViewPost, User, Action,
    IdeaRelatedPostLink, Email)
import uuid
from assembl.lib import config
from jwzthreading import restrip_pat


posts = Service(name='posts', path=API_DISCUSSION_PREFIX + '/posts',
                description="Post API following SIOC vocabulary as much as possible",
                renderer='json')

post = Service(name='post', path=API_DISCUSSION_PREFIX + '/posts/{id:.+}',
               description="Manipulate a single post")

post_read = Service(name='post_read', path=API_DISCUSSION_PREFIX + '/post_read/{id:.+}',
               description="Signal that a post was read",
               renderer='json')

_ = TranslationStringFactory('assembl')


@posts.get(permission=P_READ)
def get_posts(request):
    """
    Query interface on posts
    Filters have two forms:
    only_*, is for filters that cannot be reversed (ex: only_synthesis)
    is_*, is for filters that can be reversed (ex:is_unread=true returns only unread
    order can be chronological, reverse_chronological
    message, is_unread=false returns only read messages)
    """
    localizer = request.localizer
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get(int(discussion_id))
    if not discussion:
        raise HTTPNotFound(localizer.translate(
            _("No discussion found with id=%s")) % discussion_id)

    discussion.import_from_sources()

    user_id = authenticated_userid(request)
    permissions = get_permissions(user_id, discussion_id)

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

    order = request.GET.get('order')
    if order == None:
        order = 'chronological'
    assert order in ('chronological', 'reverse_chronological')
        
    if page < 1:
        page = 1

    root_post_id = request.GET.getall('root_post_id')
    if root_post_id:
        root_post_id = get_database_id("Post", root_post_id[0])

    root_idea_id = request.GET.getall('root_idea_id')
    if root_idea_id:
        root_idea_id = get_database_id("Idea", root_idea_id[0])

    ids = request.GET.getall('ids[]')
    if ids:
        ids = [get_database_id("Post", id) for id in ids]

    view_def = request.GET.get('view') or 'default'
    

    only_synthesis = request.GET.get('only_synthesis')
    PostClass = SynthesisPost if only_synthesis == "true" else Post
    posts = Post.db.query(PostClass)

    posts = posts.filter(
        PostClass.discussion_id == discussion_id,
    )
    ##no_of_posts_to_discussion = posts.count()

    post_data = []
    
    only_orphan = request.GET.get('only_orphan')
    if only_orphan == "true":
        if root_idea_id:
            raise HTTPBadRequest(localizer.translate(
                _("Getting orphan posts of a specific idea isn't supported.")))
        orphans = text(Idea._get_orphan_posts_statement(),
                        bindparams=[bindparam('discussion_id', discussion_id)]
                        ).columns(column('post_id')).alias('orphans')
        posts = posts.join(orphans, PostClass.id==orphans.c.post_id)
    elif only_orphan == "false":
        raise HTTPBadRequest(localizer.translate(
            _("Getting non-orphan posts isn't supported.")))

    if root_idea_id:
        related = text(Idea._get_related_posts_statement(),
                    bindparams=[bindparam('root_idea_id', root_idea_id),
                    bindparam('discussion_id', discussion_id)]
                    ).columns(column('post_id')).alias('related')
        #Virtuoso bug: This should work...
        #posts = posts.join(related, PostClass.id==related.c.post_id)
        posts = posts.filter(PostClass.id.in_(related))
    if root_post_id:
        root_post = Post.get(root_post_id)
                
        posts = posts.filter(
            (Post.ancestry.like(
            root_post.ancestry + cast(root_post.id, String) + ',%'
            ))
            |
            (PostClass.id==root_post.id)
            )
    else:
        root_post = None
    
    if ids:
        posts = posts.filter(Post.id.in_(ids))

    # Post read/unread management
    is_unread = request.GET.get('is_unread')
    if user_id:
        posts = posts.outerjoin(ViewPost,
                    and_(ViewPost.actor_id==user_id, ViewPost.post_id==PostClass.id)
                )
        posts = posts.add_entity(ViewPost)
        
        if is_unread == "true":
            posts = posts.filter(ViewPost.id == None)
        elif is_unread == "false":
            posts = posts.filter(ViewPost.id != None)
    else:
        #If there is no user_id, all posts are always unread
        if is_unread == "false":
            raise HTTPBadRequest(localizer.translate(
                _("You must be logged in to view which posts are read")))
        
    #posts = posts.options(contains_eager(Post.source))
    # Horrible hack... But useful for structure load
    if view_def == 'id_only':
        pass  # posts = posts.options(defer(Post.body))
    else:
        posts = posts.options(joinedload_all(Post.creator), undefer(Email.recipients))
        posts = posts.options(joinedload_all(Post.extracts))
        posts = posts.options(joinedload_all(Post.widget_idea_links))
        posts = posts.options(joinedload_all(SynthesisPost.publishes_synthesis))

    if order == 'chronological':
        posts = posts.order_by(Content.creation_date)
    elif order == 'reverse_chronological':
        posts = posts.order_by(Content.creation_date.desc())

    no_of_posts = 0
    no_of_posts_viewed_by_user = 0
    

    for query_result in posts:
        if user_id:
            post, viewpost = query_result
        else:
            post, viewpost = query_result, None
        no_of_posts += 1
        serializable_post = post.generic_json(
            view_def, user_id, permissions) or {}

        if viewpost:
            serializable_post['read'] = True
            no_of_posts_viewed_by_user += 1
        elif user_id and root_post is not None and root_post.id == post.id:
            #Mark post read, we requested it explicitely
            viewed_post = ViewPost(
                actor_id=user_id,
                post=root_post
                )
            Post.db.add(viewed_post)
            serializable_post['read'] = True
        else:
            serializable_post['read'] = False

        post_data.append(serializable_post)

    # Benoitg:  For now, this completely garbles threading without intelligent
    #handling of pagination.  Disabling
    #posts = posts.limit(page_size).offset(data['startIndex']-1)
    # This code isn't up to date.  If limiting the query by page, we need to 
    # calculate the counts with a separate query to have the right number of 
    # results
    #no_of_messages_viewed_by_user = Post.db.query(ViewPost).join(
    #    Post
    #).filter(
    #    Post.discussion_id == discussion_id,
    #    ViewPost.actor_id == user_id,
    #).count() if user_id else 0

    data = {}
    data["page"] = page
    data["unread"] = no_of_posts - no_of_posts_viewed_by_user
    data["total"] = no_of_posts
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
    view_def = request.GET.get('view') or 'default'

    if not post:
        raise HTTPNotFound("Post with id '%s' not found." % post_id)
    discussion_id = int(request.matchdict['discussion_id'])
    user_id = authenticated_userid(request)
    permissions = get_permissions(user_id, discussion_id)

    return post.generic_json(view_def, user_id, permissions)


@post_read.put(permission=P_READ)
def mark_post_read(request):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get_instance(discussion_id)
    post_id = request.matchdict['id']
    post = Post.get_instance(post_id)
    if not post:
        raise HTTPNotFound("Post with id '%s' not found." % post_id)
    post_id = post.id
    user_id = authenticated_userid(request)
    if not user_id:
        raise HTTPUnauthorized()
    read_data = json.loads(request.body)
    db = Discussion.db()
    change = False
    with transaction.manager:
        if read_data.get('read', None) is False:
            view = db.query(ViewPost).filter(
                ViewPost.post_id==post_id).filter(
                Action.actor_id==user_id).first()
            if view:
                change = True
                db.delete(view)
        else:
            count = db.query(ViewPost).filter(
                ViewPost.post_id==post_id).filter(
                Action.actor_id==user_id).count()
            if not count:
                change = True
                db.add(ViewPost(post=post, actor_id=user_id))

    new_counts = []
    if change:
        new_counts = Idea.idea_read_counts(discussion_id, post_id, user_id)

    return { "ok": True, "ideas": [
        {"@id": Idea.uri_generic(idea_id),
         "num_read_posts": read_posts
        } for (idea_id, read_posts) in new_counts] }


@posts.post(permission=P_ADD_POST)
def create_post(request):
    """
    We use post, not put, because we don't know the id of the post
    """
    localizer = request.localizer
    request_body = json.loads(request.body)
    user_id = authenticated_userid(request)
    user = Post.db.query(User).filter_by(id=user_id).one()

    message = request_body.get('message', None)
    html = request_body.get('html', None)
    reply_id = request_body.get('reply_id', None)
    idea_id = request_body.get('idea_id', None)
    subject = request_body.get('subject', None)
    publishes_synthesis_id = request_body.get('publishes_synthesis_id', None)
    
    if not user_id:
        raise HTTPUnauthorized()

    if not message:
        raise HTTPBadRequest(localizer.translate(
                _("Your message is empty")))

    if reply_id:
        in_reply_to_post = Post.get_instance(reply_id)
    else:
        in_reply_to_post = None
    
    if idea_id:
        in_reply_to_idea = Idea.get_instance(idea_id)
    else:
        in_reply_to_idea = None

    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get_instance(discussion_id)

    if not discussion:
        raise HTTPNotFound(
            localizer.translate(_("No discussion found with id=%s" % discussion_id))
        )

    if subject:
        subject = subject
    else:
        #print(in_reply_to_post.subject, discussion.topic)
        if in_reply_to_post:
            subject = in_reply_to_post.get_title() if in_reply_to_post.get_title() else ''
        elif in_reply_to_idea:
            #TODO:  THis should use a cascade like the frontend   
            subject = in_reply_to_idea.short_title if in_reply_to_idea.short_title else ''
        else:
            subject = discussion.topic if discussion.topic else ''
        #print subject
        subject = "Re: " + restrip_pat.sub('', subject)

    post_constructor_args = {
        'discussion': discussion,
        'message_id': uuid.uuid1().hex+"@"+config.get('public_hostname'),
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

    new_post.db.add(new_post)
    new_post.db.flush()

    if in_reply_to_post:
        new_post.set_parent(in_reply_to_post)
    if in_reply_to_idea:
        idea_post_link = IdeaRelatedPostLink(
            creator_id=user_id,
            content=new_post,
            idea=in_reply_to_idea
        )
        IdeaRelatedPostLink.db.add(idea_post_link)
    for source in discussion.sources:
        source.send_post(new_post)
    permissions = get_permissions(user_id, discussion_id)

    return new_post.generic_json('default', user_id, permissions)
