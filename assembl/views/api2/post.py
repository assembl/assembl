from datetime import datetime

from pyramid.view import view_config
from pyramid.response import Response
from pyramid.httpexceptions import HTTPUnauthorized, HTTPBadRequest

from assembl.auth import P_READ, P_MODERATE, P_DELETE_POST, P_DELETE_MY_POST
from assembl.auth.util import get_permissions
from assembl.models import Content, Post, SynthesisPost, User, Extract
from assembl.models.post import PublicationStates
from ..traversal import InstanceContext, CollectionContext
from . import (
    FORM_HEADER, JSON_HEADER, instance_put_json, instance_put_form,
    collection_add_json, collection_add_with_params)


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Content, permission=P_READ,
             accept="application/json", name="similar",
             renderer='json')
def show_similar_posts(request):
    ctx = request.context
    post = ctx._instance
    from assembl.nlp.clusters import SemanticAnalysisData
    analysis = SemanticAnalysisData(post.discussion)
    similar = analysis.get_similar_posts(post.id)
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


@view_config(context=InstanceContext, request_method='DELETE',
    ctx_instance_class=Post, renderer='json')
def delete_post_instance(request):
    # Users who are allowed to delete (actually tombstone) a Post instance:
    # - user who is the author of the Post instance and who has the P_DELETE_MY_POST permission in this discussion
    # - user who has the P_DELETE_POST permission in this discussion
    ctx = request.context
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    instance = ctx._instance

    allowed = False
    if (user_id == instance.creator_id and P_DELETE_MY_POST in permissions) or (P_DELETE_POST in permissions):
        allowed = True
    if not allowed:
        raise HTTPUnauthorized()

    # Remove extracts associated to this post
    extracts_to_remove = instance.db.query(Extract).filter(Extract.content_id == instance.id).all()
    number_of_extracts = len(extracts_to_remove)
    for extract in extracts_to_remove:
        extract.delete()

    if user_id == instance.creator_id and P_DELETE_MY_POST in permissions:
        cause = PublicationStates.DELETED_BY_USER
    elif P_DELETE_POST in permissions:
        cause = PublicationStates.DELETED_BY_ADMIN

    instance.delete_post(cause)

    return {
        "result": "Post has been successfully deleted.",
        "removed_extracts": number_of_extracts
    }


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
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized()
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
    json_data = request.json_body
    if has_moderation(json_data):
        raise_if_cannot_moderate(request)
        json_data['moderated_on'] = datetime.utcnow().isoformat()+"Z"
        json_data['moderator'] = User.uri_generic(
            request.authenticated_userid)
    # TODO: apply guess_languages
    return instance_put_json(request, json_data)


@view_config(
    context=InstanceContext, request_method='PATCH', ctx_instance_class=Post,
    header=FORM_HEADER, renderer='json')
@view_config(
    context=InstanceContext, request_method='PUT', ctx_instance_class=Post,
    header=FORM_HEADER, renderer='json')
def post_put(request):
    form_data = request.params
    if has_moderation(form_data):
        raise_if_cannot_moderate(request)
        form_data = dict(form_data)
        form_data['moderated_on'] = datetime.utcnow().isoformat()+"Z"
        form_data['moderator'] = User.uri_generic(
            request.authenticated_userid)
    # TODO: apply guess_languages
    return instance_put_form(request, form_data)


@view_config(
    context=CollectionContext, request_method='POST',
    ctx_collection_class=Post, header=FORM_HEADER, renderer='json')
def add_post_form(request):
    if has_moderation(request.params):
        raise HTTPBadRequest("Cannot moderate at post creation")
    # TODO: apply guess_languages
    return collection_add_with_params(request)


@view_config(
    context=CollectionContext, request_method='POST',
    ctx_collection_class=Post, header=JSON_HEADER, renderer='json')
def add_post_json(request):
    if has_moderation(request.json):
        raise HTTPBadRequest("Cannot moderate at post creation")
    # TODO: apply guess_languages
    return collection_add_json(request)
