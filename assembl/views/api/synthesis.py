import json
import transaction

from cornice import Service
from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.synthesis.models import Discussion, Synthesis
from assembl.auth import (P_READ, P_ADD_IDEA)
from . import acls

synthesis = Service(
    name='synthesis',
    path=API_DISCUSSION_PREFIX + '/synthesis/',
    description="Manipulate the synthesis for a discussion",
    acl=acls)


@synthesis.get()  # permission=P_READ)
def get_synthesis(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = Discussion.get(id=discussion_id)

    return discussion.synthesis.serializable()


# Update
@synthesis.put()  # permission=P_ADD_IDEA)
def save_synthesis(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = Discussion.get(id=discussion_id)
    synthesis_data = json.loads(request.body)
    synthesis = discussion.synthesis

    with transaction.manager:
        synthesis.subject = synthesis_data.get('subject')
        synthesis.introduction = synthesis_data.get('introduction')
        synthesis.conclusion = synthesis_data.get('conclusion')

        Synthesis.db.add(synthesis)

    synthesis = Synthesis.db.merge(synthesis)

    return {'ok': True, 'id': synthesis.id}
