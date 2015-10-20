from pyramid.view import view_config
from pyramid.response import Response
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import authenticated_userid, Everyone

from assembl.auth import P_READ, P_MODERATE
from assembl.auth.util import get_permissions
from assembl.models import Content, Post, SynthesisPost
from assembl.models.post import PublicationStates
from ..traversal import InstanceContext, CollectionContext
from . import (
    FORM_HEADER, JSON_HEADER, instance_put_json, instance_put,
    collection_add_json, collection_add_with_params)


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Content, permission=P_READ,
             accept="application/json", name="similar",
             renderer='json')
def show_similar_posts(request):
    ctx = request.context
    post = ctx._instance
    from assembl.nlp.clusters import get_similar_posts
    similar = get_similar_posts(post.discussion, post.id)
    view = (request.matchdict or {}).get('view', None)\
        or ctx.get_default_view() or 'default'
    if view == 'id_only':
        return similar
    post_ids = [x[0] for x in similar]
    posts = post.db.query(Content).filter(Content.id.in_(post_ids))
    posts = {post.id: post for post in posts}
    results = [posts[post_id].generic_json(view)
               for (post_id, score) in similar]
    for n, (post_id, score) in enumerate(similar):
        results[n]['score'] = float(score)
    return results


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=SynthesisPost, permission=P_READ,
             accept="text/html", name="html_export")
def html_export(request):
    from pyramid_jinja2 import IJinja2Environment
    jinja_env = request.registry.queryUtility(
        IJinja2Environment, name='.jinja2')
    return Response(request.context._instance.as_html(jinja_env),
                    content_type='text/html')


moderation_fields = [
    'publication_state', 'moderator', 'moderated_on',
    'moderation_text', 'moderator_comment']


def has_moderation(fields):
    for fname in moderation_fields:
        if fname in fields and fields[fname]:
            if (fname == 'publication_state'
                    and fields[fname] == PublicationStates.PUBLISHED.name):
                continue
            return True


def raise_if_cannot_moderate(request):
    ctx = request.context
    user_id = authenticated_userid(request) or Everyone
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    if P_MODERATE not in permissions:
        raise HTTPUnauthorized()


@view_config(
    context=InstanceContext, request_method='PATCH', ctx_instance_class=Post,
    header=JSON_HEADER, renderer='json')
@view_config(
    context=InstanceContext, request_method='PUT', ctx_instance_class=Post,
    header=JSON_HEADER, renderer='json')
def post_put_json(request):
    if has_moderation(request.json):
        raise_if_cannot_moderate(request)
    return instance_put_json(request)


@view_config(
    context=InstanceContext, request_method='PATCH', ctx_instance_class=Post,
    header=FORM_HEADER, renderer='json')
@view_config(
    context=InstanceContext, request_method='PUT', ctx_instance_class=Post,
    header=FORM_HEADER, renderer='json')
def post_put(request):
    if has_moderation(request.params):
        raise_if_cannot_moderate(request)
    return instance_put(request)


@view_config(
    context=CollectionContext, request_method='POST',
    ctx_collection_class=Post, header=FORM_HEADER, renderer='json')
def add_post_form(request):
    if has_moderation(request.params):
        raise_if_cannot_moderate(request)
    return collection_add_with_params(request)


@view_config(
    context=CollectionContext, request_method='POST',
    ctx_collection_class=Post, header=JSON_HEADER, renderer='json')
def add_post_json(request):
    if has_moderation(request.json):
        raise_if_cannot_moderate(request)
    return collection_add_json(request)
