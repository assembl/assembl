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
from . import acls
from assembl.auth import (P_READ, P_ADD_IDEA)

synthesis = Service(name='synthesis', path=API_PREFIX + '/synthesis/',
                 description="Manipulate the synthesis for a discussion")


@synthesis.get()  # permission=P_READ)
def get_synthesis(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = DBSession.query(Discussion).get(discussion_id)

    return discussion.synthesis.serializable()


# Update
@synthesis.put()  # permission=P_ADD_IDEA)
def save_synthesis(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = DBSession.query(Discussion).get(discussion_id)
    synthesis_data = json.loads(request.body)
    synthesis = discussion.synthesis

    with transaction.manager:
        synthesis.subject = synthesis_data.get('subject')
        synthesis.introduction = synthesis_data.get('introduction')
        synthesis.conclusion = synthesis_data.get('conclusion')

        DBSession.add(synthesis)

    synthesis = DBSession.merge(synthesis)

    return { 'ok': True, 'id': synthesis.id }
