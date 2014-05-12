import json

from cornice import Service

from . import API_DISCUSSION_PREFIX
from assembl.auth import P_READ, P_EDIT_SYNTHESIS
from assembl.models import Discussion, Synthesis


synthesis = Service(name='ExplicitSubgraphs',
    path=API_DISCUSSION_PREFIX + '/explicit_subgraphs/synthesis/{id:.+}',
    description="Manipulate a single synthesis")

@synthesis.get(permission=P_READ)
def get_synthesis(request):
    synthesis_id = request.matchdict['id']
    if synthesis_id == 'next_synthesis':
        discussion_id = request.matchdict['discussion_id']
        discussion = Discussion.get_instance(discussion_id)
        synthesis = discussion.get_next_synthesis()
    else:
        synthesis = Synthesis.get_instance(synthesis_id)

    view_def = request.GET.get('view') or 'default'

    return synthesis.generic_json(view_def)

# Update
@synthesis.put(permission=P_EDIT_SYNTHESIS)
def save_synthesis(request):
    synthesis_id = request.matchdict['id']
    if synthesis_id == 'next_synthesis':
        discussion_id = request.matchdict['discussion_id']
        discussion = Discussion.get_instance(discussion_id)
        synthesis = discussion.get_next_synthesis()
    else:
        synthesis = Synthesis.get_instance(synthesis_id)

    synthesis_data = json.loads(request.body)

    synthesis.subject = synthesis_data.get('subject')
    synthesis.introduction = synthesis_data.get('introduction')
    synthesis.conclusion = synthesis_data.get('conclusion')

    Synthesis.db.add(synthesis)
    Synthesis.db.flush()

    return {'ok': True, 'id': synthesis.uri()}
