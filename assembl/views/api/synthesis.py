import json
import transaction

from cornice import Service
from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.synthesis.models import Discussion, Synthesis
from assembl.auth import (P_READ, P_EDIT_SYNTHESIS, P_SEND_SYNTHESIS)
from . import acls

synthesis = Service(
    name='synthesis',
    path=API_DISCUSSION_PREFIX + '/synthesis/',
    description="Manipulate the synthesis for a discussion",
    acl=acls)


@synthesis.get(permission=P_READ)
def get_synthesis(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = Discussion.get_instance(discussion_id)
    view_def = request.GET.get('view')

    if view_def:
        return discussion.synthesis.generic_json(view_def)
    else:
        return discussion.synthesis.serializable()


# Update
@synthesis.put(permission=P_EDIT_SYNTHESIS)
def save_synthesis(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = Discussion.get_instance(discussion_id)
    synthesis_data = json.loads(request.body)
    synthesis = discussion.synthesis

    synthesis.subject = synthesis_data.get('subject')
    synthesis.introduction = synthesis_data.get('introduction')
    synthesis.conclusion = synthesis_data.get('conclusion')

    Synthesis.db.add(synthesis)
    Synthesis.db.flush()

    return {'ok': True, 'id': synthesis.uri()}
