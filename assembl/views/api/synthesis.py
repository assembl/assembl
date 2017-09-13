"""Cornice API for Synthesis"""
import json

from pyramid.httpexceptions import HTTPNotFound, HTTPBadRequest
from pyramid.security import Everyone
from cornice import Service

from . import API_DISCUSSION_PREFIX
from assembl.auth import P_READ, P_EDIT_SYNTHESIS
from assembl.auth.util import get_permissions, effective_userid
from assembl.models import Discussion, Synthesis

syntheses = Service(name='syntheses',
    path=API_DISCUSSION_PREFIX + '/explicit_subgraphs/synthesis',
    description="List of synthesis", renderer='json')

synthesis = Service(name='ExplicitSubgraphs',
    path=API_DISCUSSION_PREFIX + '/explicit_subgraphs/synthesis/{id:.+}',
    description="Manipulate a single synthesis", renderer='json')


@syntheses.get(permission=P_READ)
def get_syntheses(request):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get(int(discussion_id))
    if not discussion:
        raise HTTPNotFound("Discussion with id '%s' not found." % discussion_id)
    user_id = effective_userid(request) or Everyone
    permissions = get_permissions(user_id, discussion_id)
    syntheses = discussion.get_all_syntheses_query()
    view_def = request.GET.get('view') or 'default'
    res = [synthesis.generic_json(view_def, user_id, permissions)
           for synthesis in syntheses]
    return [x for x in res if x is not None]


@synthesis.get(permission=P_READ)
def get_synthesis(request):
    synthesis_id = request.matchdict['id']
    if synthesis_id == 'next_synthesis':
        discussion_id = int(request.matchdict['discussion_id'])
        discussion = Discussion.get_instance(discussion_id)
        synthesis = discussion.get_next_synthesis()
    else:
        synthesis = Synthesis.get_instance(synthesis_id)
    if not synthesis:
        raise HTTPNotFound("Synthesis with id '%s' not found." % synthesis_id)

    view_def = request.GET.get('view') or 'default'
    discussion_id = int(request.matchdict['discussion_id'])
    user_id = effective_userid(request) or Everyone
    permissions = get_permissions(user_id, discussion_id)

    return synthesis.generic_json(view_def, user_id, permissions)


# Update
@synthesis.put(permission=P_EDIT_SYNTHESIS)
def save_synthesis(request):
    synthesis_id = request.matchdict['id']
    if synthesis_id == 'next_synthesis':
        discussion_id = int(request.matchdict['discussion_id'])
        discussion = Discussion.get_instance(discussion_id)
        synthesis = discussion.get_next_synthesis()
    else:
        synthesis = Synthesis.get_instance(synthesis_id)
    if not synthesis:
        raise HTTPBadRequest("Synthesis with id '%s' not found." % synthesis_id)

    synthesis_data = json.loads(request.body)

    synthesis.subject = synthesis_data.get('subject')
    synthesis.introduction = synthesis_data.get('introduction')
    synthesis.conclusion = synthesis_data.get('conclusion')

    Synthesis.default_db.add(synthesis)
    Synthesis.default_db.flush()

    return {'ok': True, 'id': synthesis.uri()}
