import json
import os
import transaction

from cornice import Service
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPNotFound
from pyramid.i18n import TranslationString as _
from assembl.views.api import FIXTURE_DIR, API_PREFIX
from assembl.db import DBSession
from assembl.synthesis.models import Idea, Discussion, Synthesis

synthesis = Service(name='synthesis', path=API_PREFIX + '/syntheses/{id}',
                 description="Manipulate a single synthesis")

    
@synthesis.get()
def get_synthesis(request):
    synthesis_id = request.matchdict['id']
    synthesis = DBSession.query(Synthesis).get(synthesis_id)

    if not synthesis:
        raise HTTPNotFound("Synthesis with id '%s' not found." % synthesis_id)

    return synthesis.serializable()


# Update
@synthesis.put()
def save_synthesis(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = DBSession.query(Discussion).get(discussion_id)
    synthesis_id = request.matchdict['id']
    synthesis_data = json.loads(request.body)

    with transaction.manager:
        synthesis = DBSession.query(Synthesis).get(synthesis_id)

        synthesis.subject = synthesis_data.get('subject')
        synthesis.introduction = synthesis_data.get('introduction')
        synthesis.conclusion = synthesis_data.get('conclusion')

        DBSession.add(synthesis)

    synthesis = DBSession.merge(synthesis)

    return { 'ok': True, 'id': synthesis.id }
