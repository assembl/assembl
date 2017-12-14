from pyramid.view import view_config
from pyramid.httpexceptions import (HTTPBadRequest, HTTPNotFound)
from pyramid.response import Response
from pyramid.security import Everyone
from pyramid.settings import asbool
import simplejson as json

from assembl.auth import (P_READ, P_EDIT_SYNTHESIS, CrudPermissions)
from assembl.models import (
    Discussion, Idea, SubGraphIdeaAssociation, Synthesis)
from assembl.auth.util import get_permissions
from ..traversal import InstanceContext, CollectionContext
from . import check_permissions


@view_config(context=InstanceContext, renderer='json', request_method='GET',
             ctx_instance_class=Discussion, permission=P_READ,
             accept="application/json", name="notifications")
def discussion_notifications(request):
    return list(request.context._instance.get_notifications())


@view_config(context=CollectionContext, renderer='json', request_method='GET',
             ctx_named_collection="Discussion.syntheses", permission=P_READ,
             accept="application/json")
def get_syntheses(request, default_view='default'):
    ctx = request.context
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check_permissions(ctx, user_id, permissions, CrudPermissions.READ)
    include_unpublished = P_EDIT_SYNTHESIS in permissions
    view = request.GET.get('view', None) or ctx.get_default_view() or default_view
    include_tombstones = asbool(request.GET.get('tombstones', False))
    discussion = ctx.get_instance_of_class(Discussion)
    q = discussion.get_all_syntheses_query(
        include_unpublished=include_unpublished,
        include_tombstones=include_tombstones)
    if view == 'id_only':
        q = q.with_entities(Synthesis.id)
        return [ctx.collection_class.uri_generic(x) for (x,) in q.all()]
    else:
        res = [i.generic_json(view, user_id, permissions) for i in q.all()]
        return [x for x in res if x is not None]


@view_config(context=CollectionContext, renderer='json', request_method='POST',
             ctx_named_collection="GViewIdeaCollectionDefinition",
             permission=P_EDIT_SYNTHESIS, accept="application/json")
def add_idea_to_synthesis(request):
    """Add an idea to an ExplictSubgraphView"""
    ctx = request.context
    graph_view = ctx.parent_instance
    if isinstance(graph_view, Synthesis) and not graph_view.is_next_synthesis:
        raise HTTPBadRequest("Synthesis is published")
    content = request.json
    idea_id = content.get('@id', None)
    if not idea_id:
        raise HTTPBadRequest("Post an idea with its @id")
    idea = Idea.get_instance(idea_id)
    if not idea:
        raise HTTPNotFound("Unknown idea")
    link = SubGraphIdeaAssociation(idea=idea, sub_graph=graph_view)
    duplicate = link.find_duplicate(False)
    if duplicate:
        link.delete()
        return duplicate.idea.generic_json()
    graph_view.db.add(link)
    graph_view.db.expire(graph_view, ["idea_assocs"])
    graph_view.send_to_changes()
    # special location
    return Response(
        json.dumps(idea.generic_json()), 201, content_type='application/json',
        location=request.url + "/" + str(idea.id))


@view_config(context=InstanceContext, renderer='json', request_method='DELETE',
             ctx_named_collection_instance="GViewIdeaCollectionDefinition",
             permission=P_EDIT_SYNTHESIS, accept="application/json")
def remove_idea_from_synthesis(request):
    """Remove an idea from an ExplictSubgraphView"""
    ctx = request.context
    graph_view = ctx.__parent__.parent_instance
    if isinstance(graph_view, Synthesis) and not graph_view.is_next_synthesis:
        raise HTTPBadRequest("Synthesis is published")
    idea = ctx._instance

    link_query = graph_view.db.query(
        SubGraphIdeaAssociation).filter_by(idea=idea, sub_graph=graph_view)
    if not link_query.count():
        raise HTTPNotFound("Idea not in view")

    link_query.delete(synchronize_session=False)

    # Send the view on the socket, and recalculate ideas linked to the view
    graph_view.db.expire(graph_view, ["idea_assocs"])
    graph_view.send_to_changes()
    return {
        "@tombstone": request.url
    }
