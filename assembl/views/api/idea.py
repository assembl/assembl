import json
import os
import transaction

from cornice import Service
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPNotFound
from pyramid.i18n import TranslationString as _
from assembl.views.api import FIXTURE_DIR, API_PREFIX
from assembl.db import DBSession
from assembl.synthesis.models import Idea, Discussion

ideas = Service(name='ideas', path=API_PREFIX + '/ideas',
                 description="",
                 renderer='json')
idea = Service(name='idea', path=API_PREFIX + '/ideas/{id}',
                 description="Manipulate a single idea")

    
# Create
@ideas.post()
def create_idea(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = DBSession.query(Discussion).get(discussion_id)
    idea_data = json.loads(request.body)

    with transaction.manager:
        new_idea = Idea(
            short_title = idea_data['shortTitle'],
            long_title = idea_data['longTitle'],
            table_of_contents_id = discussion.table_of_contents_id,
            order = idea_data.get('order', 0.0)
        )

        if idea_data['parentId']:
            parent = DBSession.query(Idea).get(idea_data['parentId'])
            new_idea.parents.append(parent)

        DBSession.add(new_idea)

    new_idea = DBSession.merge(new_idea)

    return { 'ok': True, 'id': new_idea.id }


@idea.get()
def get_idea(request):
    idea_id = request.matchdict['id']
    idea = DBSession.query(Idea).get(idea_id)

    if not idea:
        raise HTTPNotFound("Idea with id '%s' not found." % idea_id)

    return idea.serializable()


@ideas.get()
def get_ideas(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = DBSession.query(Discussion).get(discussion_id)

    ideas = DBSession.query(Idea).filter_by(
        table_of_contents_id=discussion.table_of_contents_id
    )

    return [idea.serializable() for idea in ideas]


# Update
@idea.put()
def save_idea(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = DBSession.query(Discussion).get(discussion_id)
    idea_id = request.matchdict['id']
    idea_data = json.loads(request.body)

    with transaction.manager:
        idea = DBSession.query(Idea).get(idea_id)

        idea.short_title = idea_data['shortTitle']
        idea.long_title = idea_data['longTitle']
        idea.order = idea_data.get('order', idea.order)
        
        for parent in idea.parents:
            idea.parents.remove(parent)

        if idea_data['parentId']:
            parent = DBSession.query(Idea).get(idea_data['parentId'])
            idea.parents.append(parent)


        if idea_data['inSynthesis']:
            idea.synthesis = discussion.synthesis

        else: idea.synthesis = None

        DBSession.add(idea)

    idea = DBSession.merge(idea)

    return { 'ok': True, 'id': idea.id }

# Delete
# WE DON'T DELETE IDEAS. LIVE WITH IT
