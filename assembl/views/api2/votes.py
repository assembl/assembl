from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPBadRequest, HTTPUnauthorized, HTTPNotFound)
from pyramid.security import authenticated_userid
from pyramid.response import Response
from pyramid.settings import asbool
from simplejson import dumps

from ..traversal import (CollectionContext, InstanceContext)
from assembl.auth import (
    P_READ, Everyone, CrudPermissions, P_ADMIN_DISC)
from assembl.auth.util import get_permissions
from assembl.models import (
    AbstractIdeaVote, User, AbstractVoteSpecification,
    MultiCriterionVotingWidget, get_named_class)
from . import (FORM_HEADER, JSON_HEADER, check_permissions)


# Votes are private
@view_config(context=CollectionContext, renderer='json',
             request_method='GET', permission=P_READ,
             ctx_collection_class=AbstractIdeaVote)
def votes_collection_view(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    if user_id == Everyone:
        raise HTTPUnauthorized
    view = request.GET.get('view', None) or ctx.get_default_view() or 'id_only'
    tombstones = asbool(request.GET.get('tombstones', False))
    q = ctx.create_query(view == 'id_only', tombstones).join(
        User).filter(User.id == user_id)
    if view == 'id_only':
        return [ctx.collection_class.uri_generic(x) for (x,) in q.all()]
    else:
        return [i.generic_json(view, user_id) for i in q.all()]


@view_config(context=CollectionContext, request_method='POST',
             header=JSON_HEADER,  # permission=P_ADD_VOTE?,
             ctx_collection_class=AbstractIdeaVote)
def votes_collection_add_json(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check_permissions(ctx, user_id, permissions, CrudPermissions.CREATE)
    spec = ctx.get_instance_of_class(AbstractVoteSpecification)
    if spec:
        required = spec.get_vote_class()
    else:
        required = ctx.collection_class
    typename = request.json_body.get('@type', None)
    if typename:
        cls = get_named_class(typename)
        if not issubclass(cls, required):
            raise HTTPBadRequest("@type is %s, should be in %s" % (
                typename, spec.get_vote_class().__name__))
    else:
        typename = required.external_typename()
    json = request.json_body
    json['voter'] = User.uri_generic(user_id)
    try:
        instances = ctx.create_object(typename, json, user_id)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db
        for instance in instances:
            db.add(instance)
        db.flush()
        view = request.GET.get('view', None) or 'default'
        return Response(
            dumps(first.generic_json(view, user_id, permissions)),
            location=first.uri_generic(first.id),
            status_code=201)


@view_config(context=CollectionContext, request_method='POST',
             header=FORM_HEADER, ctx_collection_class=AbstractIdeaVote)
def votes_collection_add(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check_permissions(ctx, user_id, permissions, CrudPermissions.CREATE)
    args = request.params
    spec = ctx.get_instance_of_class(AbstractVoteSpecification)
    if spec:
        required = spec.get_vote_class()
    else:
        required = ctx.collection_class
    if 'type' in args:
        args = dict(args)
        typename = args['type']
        del args['type']
        cls = get_named_class(typename)
        if not issubclass(cls, required):
            raise HTTPBadRequest("@type is %s, should be in %s" % (
                typename, spec.get_vote_class().__name__))
    else:
        typename = required.external_typename()
    args['voter_id'] = user_id
    try:
        instances = ctx.create_object(typename, None, user_id, **args)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db
        for instance in instances:
            db.add(instance)
        print "before flush"
        db.flush()
        print "after flush"
        return Response(
            dumps(first.generic_json('default', user_id, permissions)),
            location=first.uri_generic(first.id),
            status_code=201)
    raise HTTPBadRequest()


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=AbstractVoteSpecification,
             name="vote_results", renderer="json")
def vote_results(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    widget = ctx.get_instance_of_class(MultiCriterionVotingWidget)
    if not widget:
        raise HTTPNotFound()
    if False:
        # TODO: If widget session not over,
        # only admin can get intermediate results
        permissions = get_permissions(user_id, ctx.get_discussion_id())
        check_permissions(ctx, user_id, permissions, P_ADMIN_DISC)
    return ctx._instance.voting_results()
