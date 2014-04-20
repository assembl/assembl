import json

from cornice import Service

from . import API_DISCUSSION_PREFIX, acls
from assembl.auth import P_READ, P_EDIT_SYNTHESIS
from assembl.models import Discussion, Synthesis

synthesis = Service(
    name='next_synthesis',
    path=API_DISCUSSION_PREFIX + '/next_synthesis/',
    description="Manipulate the synthesis for a discussion",
    acl=acls)


@synthesis.get(permission=P_READ)
def get_synthesis(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = Discussion.get_instance(discussion_id)
    view_def = request.GET.get('view')

    if view_def:
        return discussion.get_next_synthesis().generic_json(view_def)
    else:
        return discussion.get_next_synthesis().serializable()

# Update
@synthesis.put(permission=P_EDIT_SYNTHESIS)
def save_synthesis(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = Discussion.get_instance(discussion_id)
    synthesis_data = json.loads(request.body)
    synthesis = discussion.get_next_synthesis()

    synthesis.subject = synthesis_data.get('subject')
    synthesis.introduction = synthesis_data.get('introduction')
    synthesis.conclusion = synthesis_data.get('conclusion')

    Synthesis.db.add(synthesis)
    Synthesis.db.flush()

    return {'ok': True, 'id': synthesis.uri()}
