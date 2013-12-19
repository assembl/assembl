import json
import transaction

from cornice import Service
from pyramid.httpexceptions import HTTPNotFound, HTTPBadRequest, HTTPNoContent
from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.models import (
    get_named_object, get_database_id, Idea, IdeaLink, Discussion, Extract, SubGraphIdeaAssociation)
from . import acls
from assembl.auth import (P_READ, P_ADD_IDEA, P_EDIT_IDEA)

ideas = Service(name='ideas', path=API_DISCUSSION_PREFIX + '/ideas',
                description="",
                renderer='json', acl=acls)

idea = Service(name='idea', path=API_DISCUSSION_PREFIX + '/ideas/{id:.+}',
               description="Manipulate a single idea", acl=acls)

idea_extracts = Service(
    name='idea_extracts',
    path=API_DISCUSSION_PREFIX + '/ideas_extracts/{id:.+}',
    description="Get the extracts of a single idea", acl=acls)


# Create
@ideas.post()  # permission=P_ADD_IDEA)
def create_idea(request):
    discussion_id = request.matchdict['discussion_id']
    session = Discussion.db()
    discussion = session.query(Discussion).get(int(discussion_id))
    idea_data = json.loads(request.body)

    new_idea = Idea(
        short_title=idea_data['shortTitle'],
        long_title=idea_data['longTitle'],
        discussion=discussion,
        order=idea_data.get('order', 0.0))

    session.add(new_idea)

    if idea_data['parentId']:
        parent = Idea.get_instance(idea_data['parentId'])
        session.add(IdeaLink(parent=parent, child=new_idea))

    session.flush()

    return {'ok': True, 'id': new_idea.uri()}


@idea.get(permission=P_READ)
def get_idea(request):
    idea_id = request.matchdict['id']
    idea = Idea.get_instance(idea_id)
    view_def = request.GET.get('view')

    if not idea:
        raise HTTPNotFound("Idea with id '%s' not found." % idea_id)

    if view_def:
        return idea.generic_json(view_def)
    else:
        return idea.serializable()


@ideas.get(permission=P_READ)
def get_ideas(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = Discussion.get(id=int(discussion_id))
    if not discussion:
        raise HTTPNotFound("Discussion with id '%s' not found." % discussion_id)
    next_synthesis = discussion.get_next_synthesis()
    view_def = request.GET.get('view')
    ids = request.GET.getall('ids')

    ideas = Idea.db.query(Idea).filter_by(
        discussion_id=discussion.id
    ).order_by(Idea.order, Idea.creation_date)

    ideas = ideas.outerjoin(SubGraphIdeaAssociation,
                    and_(SubGraphIdeaAssociation.sub_graph_id==next_synthesis.id, SubGraphIdeaAssociation.idea_id==Idea.id)
        )
    ideas = ideas.options(joinedload(SubGraphIdeaAssociation))
    
    if ids:
        ids = [get_database_id("Idea", id) for id in ids]
        ideas = ideas.filter(Idea.id.in_(ids))
    
    retval = []
    for idea in ideas:
        if view_def:
            serialized_idea = idea.generic_json(view_def)
        else:
            serialized_idea = idea.serializable()
        serialized_idea['inNextSynthesis'] = True if idea.id else False,
        retval.append(serialized_idea)
    retval.append(Idea.serializable_unsorted_posts_pseudo_idea(discussion))
    return retval


# Update
@idea.put()  # permission=P_EDIT_IDEA)
def save_idea(request):
    discussion_id = request.matchdict['discussion_id']
    idea_id = request.matchdict['id']
    idea_data = json.loads(request.body)

    # Special items in TOC, like unsorted posts.
    if idea_id in ['orphan_posts']:
        return {'ok': False, 'id': Idea.uri_generic(idea_id)}

    idea = Idea.get_instance(idea_id)
    if not idea:
        raise HTTPNotFound("No such idea: %s" % (idea_id))
    discussion = Discussion.get(id=int(discussion_id))
    if not discussion:
        raise HTTPNotFound("Discussion with id '%s' not found." % discussion_id)
    if(idea.discussion_id != discussion.id):
        raise HTTPBadRequest(
            "Idea from discussion %s cannot saved from different discussion (%s)." % (idea.discussion_id,discussion.id ))

    idea.short_title = idea_data['shortTitle']
    idea.long_title = idea_data['longTitle']
    idea.order = idea_data.get('order', idea.order)
    if 'parentId' in idea_data and idea_data['parentId'] is not None:
        # TODO: Make sure this is sent as a list!
        parent = Idea.get_instance(idea_data['parentId'])
        if not parent:
            raise HTTPNotFound("Missing parentId %s" % (idea_data['parentId']))
        if parent not in idea.parents:
            idea.parent_links.append(IdeaLink(parent=parent, child=idea))
            parent.send_to_changes()
        to_remove = []
        for pl in idea.parent_links:
            if pl.parent != parent:
                to_remove.append(pl)
                # The following does not seem necessary
                # pl.parent.send_to_changes()
        for pl in to_remove:
            idea.parent_links.remove(pl)
        
    next_synthesis = discussion.get_next_synthesis()
    if idea_data['inNextSynthesis']:
        if idea not in next_synthesis.ideas:
            next_synthesis.ideas.append(idea)
    else:
        if idea in next_synthesis.ideas:
            next_synthesis.ideas.remove(idea)
            
    idea.send_to_changes()

    Idea.db.add(idea)
    idea = Idea.db.merge(idea)

    return {'ok': True, 'id': idea.uri() }

# Delete
@idea.delete()  # permission=P_EDIT_IDEA
def delete_idea(request):
    idea_id = request.matchdict['id']
    idea = Idea.get_instance(idea_id)

    if not idea:
        raise HTTPNotFound("Idea with id '%s' not found." % idea_id)
    num_childrens = len(idea.children)
    if num_childrens > 0:
        raise HTTPBadRequest("Idea cannot be deleted because it still has %d child ideas." % num_childrens)
    num_extracts = len(idea.extracts)
    if num_extracts > 0:
        raise HTTPBadRequest("Idea cannot be deleted because it still has %d extracts." % num_extracts)
    db = Idea.db()
    for idealink in IdeaLink.db().query(IdeaLink).filter_by(child=idea):
        db.delete(idealink)
    db.delete(idea)
    request.response.status = HTTPNoContent.code
    return None


@idea_extracts.get()  # permission=P_READ
def get_idea_extracts(request):
    idea_id = request.matchdict['id']
    idea = Idea.get_instance(idea_id)
    view_def = request.GET.get('view')

    if not idea:
        raise HTTPNotFound("Idea with id '%s' not found." % idea_id)

    extracts = Extract.db.query(Extract).filter(
        Extract.idea_id == idea.id
    ).order_by(Extract.order.desc())

    if view_def:
        return [extract.generic_json(view_def) for extract in extracts]
    else:
        return [extract.serializable() for extract in extracts]
