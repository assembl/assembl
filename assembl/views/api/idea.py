from collections import defaultdict

import simplejson as json
from cornice import Service
from pyramid.httpexceptions import HTTPNotFound, HTTPBadRequest, HTTPNoContent
from pyramid.security import authenticated_userid
from sqlalchemy import and_

from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.models import (
    get_database_id, Idea, RootIdea, IdeaLink, Discussion,
    Extract, SubGraphIdeaAssociation)
from assembl.auth import (P_READ, P_ADD_IDEA, P_EDIT_IDEA)
from assembl.auth.util import get_permissions

ideas = Service(name='ideas', path=API_DISCUSSION_PREFIX + '/ideas',
                description="",
                renderer='json')

idea = Service(name='idea', path=API_DISCUSSION_PREFIX + '/ideas/{id:.+}',
               description="Manipulate a single idea", renderer='json')

idea_extracts = Service(
    name='idea_extracts',
    path=API_DISCUSSION_PREFIX + '/ideas_extracts/{id:.+}',
    description="Get the extracts of a single idea")


# Create
@ideas.post(permission=P_ADD_IDEA)
def create_idea(request):
    discussion_id = int(request.matchdict['discussion_id'])
    session = Discussion.default_db
    discussion = session.query(Discussion).get(int(discussion_id))
    idea_data = json.loads(request.body)

    new_idea = Idea(
        short_title=idea_data['shortTitle'],
        long_title=idea_data['longTitle'],
        discussion=discussion,
        )

    session.add(new_idea)

    if idea_data['parentId']:
        parent = Idea.get_instance(idea_data['parentId'])
    else:
        parent = discussion.root_idea
    session.add(IdeaLink(source=parent, target=new_idea, order=idea_data.get('order', 0.0)))

    session.flush()

    return {'ok': True, '@id': new_idea.uri()}


@idea.get(permission=P_READ)
def get_idea(request):
    idea_id = request.matchdict['id']
    idea = Idea.get_instance(idea_id)
    view_def = request.GET.get('view')
    discussion_id = int(request.matchdict['discussion_id'])
    user_id = authenticated_userid(request)
    permissions = get_permissions(user_id, discussion_id)

    if not idea:
        raise HTTPNotFound("Idea with id '%s' not found." % idea_id)

    return idea.generic_json(view_def, user_id, permissions)


def _get_ideas_real(discussion, view_def=None, ids=None, user_id=None):
    next_synthesis = discussion.get_next_synthesis()
    ideas = discussion.db.query(Idea).filter_by(
        discussion_id=discussion.id
    )

    ideas = ideas.outerjoin(SubGraphIdeaAssociation,
                    and_(SubGraphIdeaAssociation.sub_graph_id==next_synthesis.id, SubGraphIdeaAssociation.idea_id==Idea.id)
        )
    
    ideas = ideas.outerjoin(IdeaLink,
                    and_(IdeaLink.target_id==Idea.id)
        )
    
    ideas = ideas.order_by(IdeaLink.order, Idea.creation_date)
    
    if ids:
        ids = [get_database_id("Idea", id) for id in ids]
        ideas = ideas.filter(Idea.id.in_(ids))

    permissions = get_permissions(user_id, discussion.id)
    retval = [idea.generic_json(view_def, user_id, permissions)
              for idea in ideas]
    retval = [x for x in retval if x is not None]
    widget_data = defaultdict(list)
    for widget in discussion.widgets:
        url = widget.get_ui_endpoint()
        for data in widget.idea_data(user_id):
            try:
                data['widget_url'] = url
                data['widget_uri'] = widget.uri()
                widget_data[data['idea']].append(data)
            except KeyError as e:
                pass
    for idea_rep in retval:
        if '@id' not in idea_rep:
            continue
        data = widget_data[idea_rep['@id']]
        if data:
            idea_rep['widget_data'] = data
    return retval

@ideas.get(permission=P_READ)
def get_ideas(request):
    user_id = authenticated_userid(request)
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get(int(discussion_id))
    if not discussion:
        raise HTTPNotFound("Discussion with id '%s' not found." % discussion_id)
    view_def = request.GET.get('view')
    ids = request.GET.getall('ids')
    return _get_ideas_real(discussion=discussion, view_def=view_def,
                           ids=ids, user_id=user_id)

# Update
@idea.put(permission=P_EDIT_IDEA)
def save_idea(request):
    discussion_id = int(request.matchdict['discussion_id'])
    idea_id = request.matchdict['id']
    idea_data = json.loads(request.body)
    #Idea.default_db.execute('set transaction isolation level read committed')
    # Special items in TOC, like unsorted posts.
    if idea_id in ['orphan_posts']:
        return {'ok': False, 'id': Idea.uri_generic(idea_id)}

    idea = Idea.get_instance(idea_id)
    if not idea:
        raise HTTPNotFound("No such idea: %s" % (idea_id))
    if isinstance(idea, RootIdea):
        raise HTTPBadRequest("Cannot edit root idea.")
    discussion = Discussion.get(int(discussion_id))
    if not discussion:
        raise HTTPNotFound("Discussion with id '%s' not found." % discussion_id)
    if(idea.discussion_id != discussion.id):
        raise HTTPBadRequest(
            "Idea from discussion %s cannot saved from different discussion (%s)." % (idea.discussion_id,discussion.id ))
    if 'shortTitle' in idea_data:
        idea.short_title = idea_data['shortTitle']
    if 'longTitle' in idea_data:
        idea.long_title = idea_data['longTitle']
    if 'definition' in idea_data:
        idea.definition = idea_data['definition']
    
    if 'parentId' in idea_data and idea_data['parentId'] is not None:
        # TODO: Make sure this is sent as a list!
        parent = Idea.get_instance(idea_data['parentId'])
        # calculate it early to maximize contention.
        prev_ancestors = parent.get_all_ancestors()
        new_ancestors = set()

        order = idea_data.get('order', 0.0)
        if not parent:
            raise HTTPNotFound("Missing parentId %s" % (idea_data['parentId']))

        for parent_link in idea.source_links:
            # still assuming there's only one.
            pl_parent = parent_link.source
            pl_ancestors = pl_parent.get_all_ancestors()
            new_ancestors.update(pl_ancestors)
            if parent_link.source != parent:
                parent_link.copy(True)
                parent_link.source = parent
                parent.db.expire(parent, ['target_links'])
                parent.db.expire(pl_parent, ['target_links'])
                for ancestor in pl_ancestors:
                    if ancestor in prev_ancestors:
                        break
                    ancestor.send_to_changes()
                for ancestor in prev_ancestors:
                    if ancestor in new_ancestors:
                        break
                    ancestor.send_to_changes()
            parent_link.order = order
            parent_link.db.expire(parent_link.source, ['target_links'])
            parent_link.source.send_to_changes()
            parent_link.db.flush()

    idea.is_in_next_synthesis = idea_data.get('inNextSynthesis', False)
    idea.send_to_changes()

    return {'ok': True, 'id': idea.uri() }

# Delete
@idea.delete(permission=P_EDIT_IDEA)
def delete_idea(request):
    idea_id = request.matchdict['id']
    idea = Idea.get_instance(idea_id)

    if not idea:
        raise HTTPNotFound("Idea with id '%s' not found." % idea_id)
    if isinstance(idea, RootIdea):
        raise HTTPBadRequest("Cannot delete root idea.")
    num_childrens = len(idea.children)
    if num_childrens > 0:
        raise HTTPBadRequest("Idea cannot be deleted because it still has %d child ideas." % num_childrens)
    num_extracts = len(idea.extracts)
    if num_extracts > 0:
        raise HTTPBadRequest("Idea cannot be deleted because it still has %d extracts." % num_extracts)
    db = Idea.default_db
    db.delete(idea)
    request.response.status = HTTPNoContent.code
    return HTTPNoContent()


@idea_extracts.get(permission=P_READ)
def get_idea_extracts(request):
    idea_id = request.matchdict['id']
    idea = Idea.get_instance(idea_id)
    view_def = request.GET.get('view') or 'default'
    discussion_id = int(request.matchdict['discussion_id'])
    user_id = authenticated_userid(request)
    permissions = get_permissions(user_id, discussion_id)

    if not idea:
        raise HTTPNotFound("Idea with id '%s' not found." % idea_id)

    extracts = Extract.default_db.query(Extract).filter(
        Extract.idea_id == idea.id
    ).order_by(Extract.order.desc())

    return [extract.generic_json(view_def, user_id, permissions)
            for extract in extracts]
