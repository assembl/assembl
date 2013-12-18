import json

from pyramid.httpexceptions import HTTPNotFound
# from . import acls

from cornice import Service

from assembl.views.api import API_DISCUSSION_PREFIX

from assembl.synthesis.models import Discussion



sources = Service(
    name='sources',
    path=API_DISCUSSION_PREFIX + '/sources/',
    description="Manipulate a discussion's sources.",
    renderer='json',
)


@sources.get()
def get_sources(request):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get_instance(discussion_id)
    view_def = request.GET.get('view')

    if not discussion:
        raise HTTPNotFound(
            "Discussion with id '%s' not found." % discussion_id
        )

    if view_def:
        return [source.generic_json(view_def) for source in discussion.sources]
    else:
        return [source.serializable() for source in discussion.sources]
