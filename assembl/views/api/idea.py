import json
import transaction

from cornice import Service
from pyramid.httpexceptions import HTTPNotFound, HTTPBadRequest, HTTPNoContent
from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.models import (
    get_named_object, Idea, IdeaLink, Discussion, Extract)
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
        table_of_contents_id=discussion.table_of_contents_id,
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

    if not idea:
        raise HTTPNotFound("Idea with id '%s' not found." % idea_id)

    return idea.serializable()


@ideas.get(permission=P_READ)
def get_ideas(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = Discussion.get(id=int(discussion_id))
    if not discussion:
        raise HTTPNotFound("Discussion with id '%s' not found." % discussion_id)

    ideas = Idea.db.query(Idea).filter_by(
        table_of_contents_id=discussion.table_of_contents_id
    ).order_by(Idea.order, Idea.creation_date)
    retval = [idea.serializable() for idea in ideas]
    retval.append(Idea.serializable_unsorded_posts_pseudo_idea(discussion))
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

    with transaction.manager:
        idea = Idea.get_instance(idea_id)
        if not idea:
            raise HTTPNotFound("No such idea: %s" % (idea_id))
        discussion = Discussion.get(id=int(discussion_id))

        idea.short_title = idea_data['shortTitle']
        idea.long_title = idea_data['longTitle']
        idea.order = idea_data.get('order', idea.order)

        if 'parentId' in idea_data:
            # TODO: Make sure this is sent as a list!
            parent = Idea.get_instance(idea_data['parentId'])
            if not parent:
                raise HTTPNotFound("Missing parentId %s" % (idea_data['parentId']))
            if parent not in idea.parents:
                idea.parent_links.append(IdeaLink(parent=parent, child=idea))
            to_remove = []
            for pl in idea.parent_links:
                if pl.parent != parent:
                    to_remove.append(pl)
            for pl in to_remove:
                idea.parent_links.remove(pl)

        if idea_data['inSynthesis']:
            idea.synthesis = discussion.synthesis
        else:
            idea.synthesis = None

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

    if not idea:
        raise HTTPNotFound("Idea with id '%s' not found." % idea_id)

    extracts = Extract.db.query(Extract).filter(
        Extract.idea_id == idea.id
    ).order_by(Extract.order.desc())

    serializable_extracts = [
        extract.serializable() for extract in extracts
    ]

    return serializable_extracts
