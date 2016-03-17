from pyramid.view import view_config
from pyramid.httpexceptions import (HTTPBadRequest, HTTPNotFound)
from pyramid.response import Response
import simplejson as json

from assembl.auth import (P_READ, P_EDIT_SYNTHESIS)
from assembl.models import (
    Discussion, Idea, SubGraphIdeaAssociation, Synthesis)
from ..traversal import InstanceContext, CollectionContext


@view_config(context=InstanceContext, renderer='json', request_method='GET',
             ctx_instance_class=Discussion, permission=P_READ,
             accept="application/json", name="notifications")
def discussion_notifications(request):
    return list(request.context._instance.get_notifications())


@view_config(context=CollectionContext, renderer='json', request_method='POST',
             ctx_named_collection="GViewIdeaCollectionDefinition",
             permission=P_EDIT_SYNTHESIS, accept="application/json")
def add_idea_to_synthesis(request):
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
    ctx = request.context
    graph_view = ctx.__parent__.parent_instance
    if isinstance(graph_view, Synthesis) and not graph_view.is_next_synthesis:
        raise HTTPBadRequest("Synthesis is published")
    idea = ctx._instance
    link = SubGraphIdeaAssociation(idea=idea, sub_graph=graph_view)
    duplicate = link.find_duplicate(True)
    link.delete()
    if duplicate:
        duplicate.delete()
        graph_view.db.expire(graph_view, ["idea_assocs"])
        graph_view.send_to_changes()
        return {
            "@tombstone": idea.uri()
        }
    else:
        raise HTTPNotFound("Idea not in view")
