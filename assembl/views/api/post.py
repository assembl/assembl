"""Cornice API for posts"""
from math import ceil
import logging
from collections import defaultdict

import simplejson as json
from cornice import Service
from pyramid.httpexceptions import (
    HTTPNotFound, HTTPUnauthorized, HTTPBadRequest)
from pyramid.i18n import TranslationStringFactory
from pyramid.settings import asbool
from pyramid.security import Everyone

from sqlalchemy import String, text

from sqlalchemy.orm import (
    joinedload_all, aliased, subqueryload_all, undefer)
from sqlalchemy.sql.expression import bindparam, and_
from sqlalchemy.sql import cast, column
from sqlalchemy.sql.functions import count

from jwzthreading import restrip_pat

import transaction

from assembl.lib.parsedatetime import parse_datetime
from assembl.lib.clean_input import sanitize_html, sanitize_text
from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.auth import P_READ, P_ADD_POST
from assembl.auth.util import get_permissions
from assembl.tasks.translate import (
    translate_content,
    PrefCollectionTranslationTable)
from assembl.models import (
    get_database_id, Post, AssemblPost, SynthesisPost,
    Synthesis, Discussion, Content, Idea, ViewPost, User,
    IdeaRelatedPostLink, AgentProfile, LangString,
    DummyContext, LanguagePreferenceCollection, SentimentOfPost)
from assembl.models.post import deleted_publication_states
from assembl.lib.raven_client import capture_message

log = logging.getLogger('assembl')

posts = Service(name='posts', path=API_DISCUSSION_PREFIX + '/posts',
                description="Post API following SIOC vocabulary as much as possible",
                renderer='json')

post = Service(name='post', path=API_DISCUSSION_PREFIX + '/posts/{id:.+}',
               description="Manipulate a single post", renderer="json")

post_read = Service(name='post_read', path=API_DISCUSSION_PREFIX + '/post_read/{id:.+}',
               description="Signal that a post was read",
               renderer='json')

_ = TranslationStringFactory('assembl')


@posts.get(permission=P_READ)
def get_posts(request):
    """
    Query interface on posts
    Filters have two forms:
    only_*, is for filters that cannot be reversed (ex: only_synthesis, only_orphan)
    is_*, is for filters that can be reversed (ex:is_unread=true returns only unread message, is_unread=false returns only read messages)
    order: can be chronological, reverse_chronological, popularity
    root_post_id: all posts below the one specified.
    family_post_id: all posts below the one specified, and all its ancestors.
    post_reply_to: replies to a given post
    root_idea_id: all posts associated with the given idea
    ids: explicit message ids.
    posted_after_date, posted_before_date: date selection (ISO format)
    post_author: filter by author
    classifier: filter on message_classifier, or absence thereof (classifier=null). Can be negated with "!"
    """
    localizer = request.localizer
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get(int(discussion_id))
    if not discussion:
        raise HTTPNotFound(localizer.translate(
            _("No discussion found with id=%s")) % discussion_id)

    discussion.import_from_sources()

    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(user_id, discussion_id)

    DEFAULT_PAGE_SIZE = 25
    page_size = DEFAULT_PAGE_SIZE

    filter_names = [
        filter_name for filter_name
        in request.GET.getone('filters').split(',')
        if filter_name
    ] if request.GET.get('filters') else []

    try:
        page = int(request.GET.getone('page'))
    except (ValueError, KeyError):
        page = 1

    text_search = request.GET.get('text_search', None)

    order = request.GET.get('order')
    if order is None:
        order = 'chronological'
    assert order in ('chronological', 'reverse_chronological', 'score', 'popularity')
    if order == 'score':
        assert text_search is not None

    if page < 1:
        page = 1

    root_post_id = request.GET.getall('root_post_id')
    if root_post_id:
        root_post_id = get_database_id("Post", root_post_id[0])
    family_post_id = request.GET.getall('family_post_id')
    if family_post_id:
        family_post_id = get_database_id("Post", family_post_id[0])

    root_idea_id = request.GET.getall('root_idea_id')
    if root_idea_id:
        root_idea_id = get_database_id("Idea", root_idea_id[0])

    ids = request.GET.getall('ids[]')
    if ids:
        ids = [get_database_id("Post", id) for id in ids]

    view_def = request.GET.get('view') or 'default'

    only_synthesis = request.GET.get('only_synthesis')

    post_author_id = request.GET.get('post_author')
    if post_author_id:
        post_author_id = get_database_id("AgentProfile", post_author_id)
        assert AgentProfile.get(post_author_id), "Unable to find agent profile with id " + post_author_id

    post_replies_to = request.GET.get('post_replies_to')
    if post_replies_to:
        post_replies_to = get_database_id("AgentProfile", post_replies_to)
        assert AgentProfile.get(post_replies_to), "Unable to find agent profile with id " + post_replies_to

    posted_after_date = request.GET.get('posted_after_date')
    posted_before_date = request.GET.get('posted_before_date')
    message_classifiers = request.GET.getall('classifier')

    PostClass = SynthesisPost if only_synthesis == "true" else Post
    if order == 'score':
        posts = discussion.db.query(PostClass, Content.body_text_index.score_name)
    else:
        posts = discussion.db.query(PostClass)

    posts = posts.filter(
        PostClass.discussion_id == discussion_id,
    ).filter(PostClass.type != 'proposition_post')
    ##no_of_posts_to_discussion = posts.count()

    post_data = []

    # True means deleted only, False (default) means non-deleted only. None means both.

    # v0
    # deleted = request.GET.get('deleted', None)
    # end v0

    # v1: we would like something like that
    # deleted = request.GET.get('deleted', None)
    # if deleted is None:
    #     if view_def == 'id_only':
    #         deleted = None
    #     else:
    #         deleted = False
    # end v1

    # v2
    # deleted = request.GET.get('deleted', None)
    # if deleted is None:
    #     if not ids:
    #         deleted = False
    #     else:
    #         deleted = None
    #
    # if deleted == 'false':
    #     deleted = False
    #     posts = posts.filter(PostClass.tombstone_condition())
    # elif deleted == 'true':
    #     deleted = True
    #     posts = posts.filter(PostClass.not_tombstone_condition())
    # elif deleted == 'any':
    #     deleted = None
    #     # result will contain deleted and non-deleted posts
    #     pass
    # end v2


    # v3
    # deleted = request.GET.get('deleted', None)
    # if deleted is None:
    #     if not ids:
    #         deleted = False
    #     else:
    #         deleted = None

    # if deleted == 'true':
    #     deleted = True
    #     posts = posts.filter(PostClass.not_tombstone_condition())
    # end v3

    # v4
    deleted = request.GET.get('deleted', None)
    if deleted is None:
        if not ids:
            deleted = False
        else:
            deleted = None
    elif deleted.lower() == "any":
        deleted = None
    else:
        deleted = asbool(deleted)
    # if deleted is not in (False, True, None):
    #    deleted = False
    # end v4

    only_orphan = asbool(request.GET.get('only_orphan', False))
    if only_orphan:
        if root_idea_id:
            raise HTTPBadRequest(localizer.translate(
                _("Getting orphan posts of a specific idea isn't supported.")))
        orphans = Idea._get_orphan_posts_statement(
            discussion_id, True, include_deleted=deleted).subquery("orphans")
        posts = posts.join(orphans, PostClass.id == orphans.c.post_id)

    if root_idea_id:
        related = Idea.get_related_posts_query_c(
            discussion_id, root_idea_id, True, include_deleted=deleted)
        posts = posts.join(related, PostClass.id == related.c.post_id)
    elif not only_orphan:
        if deleted is not None:
            if deleted:
                posts = posts.filter(
                    PostClass.publication_state.in_(
                        deleted_publication_states))
            else:
                posts = posts.filter(
                    PostClass.tombstone_date == None)

    if root_post_id:
        root_post = Post.get(root_post_id)

        posts = posts.filter(
            (Post.ancestry.like(
            root_post.ancestry + cast(root_post.id, String) + ',%'
            ))
            |
            (PostClass.id==root_post.id)
            )
    elif family_post_id:
        root_post = Post.get(family_post_id)
        ancestor_ids = root_post.ancestor_ids()
        posts = posts.filter(
            (Post.ancestry.like(
            root_post.ancestry + cast(root_post.id, String) + ',%'
            ))
            |
            (PostClass.id==root_post.id)
            |
            (PostClass.id.in_(ancestor_ids))
            )
    else:
        root_post = None

    if ids:
        posts = posts.filter(Post.id.in_(ids))

    if posted_after_date:
        posted_after_date = parse_datetime(posted_after_date)
        if posted_after_date:
            posts = posts.filter(PostClass.creation_date >= posted_after_date)
        #Maybe we should do something if the date is invalid.  benoitg

    if posted_before_date:
        posted_before_date = parse_datetime(posted_before_date)
        if posted_before_date:
            posts = posts.filter(PostClass.creation_date <= posted_before_date)
        #Maybe we should do something if the date is invalid.  benoitg

    if post_author_id:
        posts = posts.filter(PostClass.creator_id == post_author_id)

    if message_classifiers:
        if any([len(classifier) == 0 for classifier in message_classifiers]):
            return {'total': 0, 'posts': []}
        polarities = [classifier[0] != "!" for classifier in message_classifiers]
        polarity = all(polarities)
        if not polarity:
            message_classifiers = [c.strip("!") for c in message_classifiers]
        if polarity != any(polarities):
            raise HTTPBadRequest(_("Do not combine negative and positive classifiers"))
        # Treat null as no classifier
        includes_null = 'null' in message_classifiers
        if includes_null:
            message_classifiers_nonull = filter(lambda c: c != "null", message_classifiers)
        if polarity:
            if len(message_classifiers) == 1:
                term = PostClass.message_classifier == (None if includes_null else message_classifiers[0])
            else:
                term = PostClass.message_classifier.in_(message_classifiers_nonull)
                if includes_null:
                    term = term | (PostClass.message_classifier == None)
        else:
            if len(message_classifiers) == 1:
                term = PostClass.message_classifier != (None if includes_null else message_classifiers[0])
            else:
                term = PostClass.message_classifier.notin_(message_classifiers_nonull)
            if not includes_null:
                term = term | (PostClass.message_classifier == None)
        posts = posts.filter(term)

    if post_replies_to:
        parent_alias = aliased(PostClass)
        posts = posts.join(parent_alias, PostClass.parent)
        posts = posts.filter(parent_alias.creator_id == post_replies_to)
    # Post read/unread management
    is_unread = request.GET.get('is_unread')
    translations = None
    if user_id != Everyone:
        # This is horrible, but the join creates complex subqueries that
        # virtuoso cannot decode properly.
        read_posts = {v.post_id for v in discussion.db.query(
            ViewPost).filter(
                ViewPost.tombstone_condition(),
                ViewPost.actor_id == user_id,
                *ViewPost.get_discussion_conditions(discussion_id))}
        my_sentiments = {l.post_id: l for l in discussion.db.query(
            SentimentOfPost).filter(
                SentimentOfPost.tombstone_condition(),
                SentimentOfPost.actor_id == user_id,
                *SentimentOfPost.get_discussion_conditions(discussion_id))}
        if is_unread != None:
            posts = posts.outerjoin(
                ViewPost, and_(
                    ViewPost.actor_id==user_id,
                    ViewPost.post_id==PostClass.id,
                    ViewPost.tombstone_date == None))
            if is_unread == "true":
                posts = posts.filter(ViewPost.id == None)
            elif is_unread == "false":
                posts = posts.filter(ViewPost.id != None)
        user = AgentProfile.get(user_id)
        service = discussion.translation_service()
        if service.canTranslate is not None:
            translations = PrefCollectionTranslationTable(
                service, LanguagePreferenceCollection.getCurrent(request))
    else:
        #If there is no user_id, all posts are always unread
        my_sentiments = {}
        if is_unread == "false":
            raise HTTPBadRequest(localizer.translate(
                _("You must be logged in to view which posts are read")))

    if text_search is not None:
        # another Virtuoso bug: offband kills score. but it helps speed.
        offband = () if (order == 'score') else None
        posts = posts.filter(Post.body_text_index.contains(
            text_search.encode('utf-8'), offband=offband))

    # posts = posts.options(contains_eager(Post.source))
    # Horrible hack... But useful for structure load
    if view_def == 'id_only':
        pass  # posts = posts.options(defer(Post.body))
    else:
        ideaContentLinkQuery = posts.with_entities(
            PostClass.id, PostClass.idea_content_links_above_post)
        ideaContentLinkCache = dict(ideaContentLinkQuery.all())
        # Note: we could count the like the same way and kill the subquery.
        # But it interferes with the popularity order,
        # and the benefit is not that high.
        sentiment_counts = discussion.db.query(
                PostClass.id, SentimentOfPost.type, count(SentimentOfPost.id)
            ).join(SentimentOfPost
            ).filter(PostClass.id.in_(posts.with_entities(PostClass.id).subquery()),
                     SentimentOfPost.tombstone_condition()
            ).group_by(PostClass.id, SentimentOfPost.type)
        sentiment_counts_by_post_id = defaultdict(dict)
        for (post_id, sentiment_type, sentiment_count) in sentiment_counts:
            sentiment_counts_by_post_id[post_id][
                sentiment_type[SentimentOfPost.TYPE_PREFIX_LEN:]
            ] = sentiment_count
        posts = posts.options(
            # undefer(Post.idea_content_links_above_post),
            joinedload_all(Post.creator),
            joinedload_all(Post.extracts),
            joinedload_all(Post.widget_idea_links),
            joinedload_all(SynthesisPost.publishes_synthesis),
            subqueryload_all(Post.attachments))
        if len(discussion.discussion_locales) > 1:
            posts = posts.options(*Content.subqueryload_options())
        else:
            posts = posts.options(*Content.joinedload_options())

    if order == 'chronological':
        posts = posts.order_by(Content.creation_date)
    elif order == 'reverse_chronological':
        posts = posts.order_by(Content.creation_date.desc())
    elif order == 'score':
        posts = posts.order_by(Content.body_text_index.score_name.desc())
    elif order == 'popularity':
        # assume reverse chronological otherwise
        posts = posts.order_by(Content.disagree_count - Content.like_count, Content.creation_date.desc())
    else:
        posts = posts.order_by(Content.id)
    # print str(posts)

    no_of_posts = 0
    no_of_posts_viewed_by_user = 0

    if deleted is True:
        # We just got deleted posts, now we want their ancestors for context
        post_ids = set()
        ancestor_ids = set()

        def add_ancestors(post):
            post_ids.add(post.id)
            ancestor_ids.update(
                [int(x) for x in post.ancestry.strip(",").split(",") if x])
        posts = list(posts)
        for post in posts:
            add_ancestors(post)
        ancestor_ids -= post_ids
        if ancestor_ids:
            ancestors = discussion.db.query(
                PostClass).filter(PostClass.id.in_(ancestor_ids))
            if view_def == 'id_only':
                pass  # ancestors = ancestors.options(defer(Post.body))
            else:
                ancestors = ancestors.options(
                    # undefer(Post.idea_content_links_above_post),
                    joinedload_all(Post.creator),
                    joinedload_all(Post.extracts),
                    joinedload_all(Post.widget_idea_links),
                    joinedload_all(SynthesisPost.publishes_synthesis),
                    subqueryload_all(Post.attachments))
                if len(discussion.discussion_locales) > 1:
                    ancestors = ancestors.options(
                        *Content.subqueryload_options())
                else:
                    ancestors = ancestors.options(
                        *Content.joinedload_options())
            posts.extend(ancestors.all())

    for query_result in posts:
        score, viewpost = None, None
        if not isinstance(query_result, (list, tuple)):
            query_result = [query_result]
        post = query_result[0]
        if deleted is True:
            add_ancestors(post)

        if user_id != Everyone:
            viewpost = post.id in read_posts
            if view_def != "id_only":
                translate_content(
                    post, translation_table=translations, service=service)
        no_of_posts += 1
        serializable_post = post.generic_json(
            view_def, user_id, permissions) or {}
        if order == 'score':
            score = query_result[1]
            serializable_post['score'] = score

        if viewpost:
            serializable_post['read'] = True
            no_of_posts_viewed_by_user += 1
        elif user_id != Everyone and root_post is not None and root_post.id == post.id:
            # Mark post read, we requested it explicitely
            viewed_post = ViewPost(
                actor_id=user_id,
                post=root_post
                )
            discussion.db.add(viewed_post)
            serializable_post['read'] = True
        else:
            serializable_post['read'] = False
        my_sentiment = my_sentiments.get(post.id, None)
        if my_sentiment is not None:
            my_sentiment = my_sentiment.generic_json('default', user_id, permissions)
        serializable_post['my_sentiment'] = my_sentiment
        if view_def != "id_only":
            serializable_post['indirect_idea_content_links'] = (
                post.indirect_idea_content_links_with_cache(
                    ideaContentLinkCache.get(post.id, None)))
            serializable_post['sentiment_counts'] = sentiment_counts_by_post_id[post.id]

        post_data.append(serializable_post)

    # Benoitg:  For now, this completely garbles threading without intelligent
    #handling of pagination.  Disabling
    #posts = posts.limit(page_size).offset(data['startIndex']-1)
    # This code isn't up to date.  If limiting the query by page, we need to
    # calculate the counts with a separate query to have the right number of
    # results
    #no_of_messages_viewed_by_user = discussion.db.query(ViewPost).join(
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
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(user_id, discussion_id)

    return post.generic_json(view_def, user_id, permissions)


@post_read.put(permission=P_READ)
def mark_post_read(request):
    """Mark this post as un/read. Return the read post count for all affected ideas."""
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get_instance(discussion_id)
    post_id = request.matchdict['id']
    post = Post.get_instance(post_id)
    if not post:
        raise HTTPNotFound("Post with id '%s' not found." % post_id)
    post_id = post.id
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized()
    read_data = json.loads(request.body)
    db = discussion.db
    change = False
    with transaction.manager:
        if read_data.get('read', None) is False:
            view = db.query(ViewPost).filter_by(
                post_id=post_id, actor_id=user_id,
                tombstone_date=None).first()
            if view:
                change = True
                view.is_tombstone = True
        else:
            count = db.query(ViewPost).filter_by(
                post_id=post_id, actor_id=user_id,
                tombstone_date=None).count()
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
    Create a new post in this discussion.

    We use post, not put, because we don't know the id of the post
    """
    localizer = request.localizer
    request_body = json.loads(request.body)
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized()

    user = Post.default_db.query(User).filter_by(id=user_id).one()

    body = request_body.get('body', None)
    html = request_body.get('html', None)  # BG: Is this used now? I cannot see it.
    reply_id = request_body.get('reply_id', None)
    idea_id = request_body.get('idea_id', None)
    subject = request_body.get('subject', None)
    publishes_synthesis_id = request_body.get('publishes_synthesis_id', None)
    message_classifier = request_body.get('message_classifier', None)

    if not body and not publishes_synthesis_id:
        # Should we allow empty messages otherwise?
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
        raise HTTPNotFound(localizer.translate(_(
            "No discussion found with id=%s")) % (discussion_id,)
        )

    ctx = DummyContext({Discussion: discussion})
    if html:
        log.warning("Still using html")
        # how to guess locale in this case?
        body = LangString.create(sanitize_html(html))
        # TODO: AssemblPosts are pure text right now.
        # Allowing HTML requires changes to the model.
    elif body:
        # TODO: Accept HTML body.
        for e in body['entries']:
            e['value'] = sanitize_text(e['value'])
        body = LangString.create_from_json(
            body, context=ctx, user_id=user_id)
    else:
        body = LangString.EMPTY(discussion.db)

    if subject:
        for e in subject['entries']:
            e['value'] = sanitize_text(e['value'])
        subject = LangString.create_from_json(
            subject, context=ctx, user_id=user_id)
    else:
        from assembl.models import Locale
        locale = Locale.UNDEFINED
        # print(in_reply_to_post.subject, discussion.topic)
        if in_reply_to_post and in_reply_to_post.get_title():
            original_subject = in_reply_to_post.get_title().first_original()
            if original_subject:
                locale = original_subject.locale_code
                subject = (
                    original_subject.value or ''
                    if in_reply_to_post.get_title() else '')
        elif in_reply_to_idea:
            # TODO:  THis should use a cascade like the frontend
            # also, some ideas have extra langstring titles
            subject = (in_reply_to_idea.short_title
                       if in_reply_to_idea.short_title else '')
            locale = discussion.main_locale
        else:
            subject = discussion.topic if discussion.topic else ''
            locale = discussion.main_locale
        # print subject
        if subject is not None and len(subject):
            new_subject = "Re: " + restrip_pat.sub('', subject).strip()
            if (in_reply_to_post and new_subject == subject and
                    in_reply_to_post.get_title()):
                # reuse subject and translations
                subject = in_reply_to_post.get_title().clone(discussion.db)
            else:
                # how to guess locale in this case?
                subject = LangString.create(new_subject, locale)
        else:
            capture_message(
                "A message is about to be written to the database with an "
                "empty subject.  This is not supposed to happen.")
            subject = LangString.EMPTY(discussion.db)

    post_constructor_args = {
        'discussion': discussion,
        'creator_id': user_id,
        'message_classifier': message_classifier,
        'subject': subject,
        'body': body
    }

    if publishes_synthesis_id:
        published_synthesis = Synthesis.get_instance(publishes_synthesis_id)
        post_constructor_args['publishes_synthesis'] = published_synthesis
        new_post = SynthesisPost(**post_constructor_args)
        new_post.finalize_publish()
    else:
        new_post = AssemblPost(**post_constructor_args)
    new_post.guess_languages()

    discussion.db.add(new_post)
    discussion.db.flush()

    if in_reply_to_post:
        new_post.set_parent(in_reply_to_post)
    if in_reply_to_idea:
        idea_post_link = IdeaRelatedPostLink(
            creator_id=user_id,
            content=new_post,
            idea=in_reply_to_idea
        )
        discussion.db.add(idea_post_link)
        idea = in_reply_to_idea
        while idea:
            idea.send_to_changes()
            parents = idea.get_parents()
            idea = next(iter(parents)) if parents else None
    else:
        discussion.root_idea.send_to_changes()
    for source in discussion.sources:
        if 'send_post' in dir(source):
            source.send_post(new_post)
    permissions = get_permissions(user_id, discussion_id)

    return new_post.generic_json('default', user_id, permissions)
