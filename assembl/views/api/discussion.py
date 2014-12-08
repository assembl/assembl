from pyramid.httpexceptions import HTTPNotFound

from cornice import Service

from assembl.views.api import API_DISCUSSION_PREFIX

from assembl.models import Discussion

from ...auth import P_READ, P_SYSADMIN

discussion = Service(
    name='discussion',
    path=API_DISCUSSION_PREFIX,
    description="Manipulate a single Discussion object",
    renderer='json',
)


@discussion.get(permission=P_READ)
def get_discussion(request):
    discussion_id = request.matchdict['discussion_id']
    discussion = Discussion.get_instance(discussion_id)
    view_def = request.GET.get('view') or 'default'

    if not discussion:
        raise HTTPNotFound("Discussion with id '%s' not found." % discussion_id)

    return discussion.generic_json(view_def)


@discussion.post(permission=P_SYSADMIN)
def post_discussion(request):
	discussion_id = request.matchdict['discussion_id']
	discussion = Discussion.get_instance(discussion_id)

	if discussion:
		g = lambda x: request.POST.get(x, None)

		(topic, slug, objectives) = (
			g('topic'),
			g('slug'),
			g('objectives'),
		)

		discussion.topic = topic
		discussion.slug = slug
		discussion.objectives = objectives

	return {}

