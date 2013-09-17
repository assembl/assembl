import json

from pyramid.httpexceptions import HTTPNotFound
# from . import acls

from cornice import Service

from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.db import DBSession

from assembl.synthesis.models import Discussion



discussion = Service(
    name='discussion',
    path=API_DISCUSSION_PREFIX + '/',
    description="Manipulate a single Discussion object",
    renderer='json',
)


@discussion.get()
def get_discussion(request):
    discussion_id = int(request.matchdict['discussion_id'])

    discussion = DBSession.query(Discussion).get(discussion_id)

    if not discussion:
        raise HTTPNotFound(
            "Discussion with id '%s' not found." % discussion_id
        )

    return discussion.serializable()
