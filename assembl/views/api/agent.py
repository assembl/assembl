from pyramid.httpexceptions import HTTPNotFound
from sqlalchemy.orm import joinedload
from cornice import Service

from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.auth import P_READ
from assembl.models import Discussion, AgentProfile


agents = Service(
    name='agents',
    path=API_DISCUSSION_PREFIX + '/agents/',
    description="Retrieve a discussion's agents.",
    renderer='json')

agent = Service(
    name='agent', path=API_DISCUSSION_PREFIX + '/agents/{id:.+}',
    description="Retrieve a single agent", renderer='json')

def _get_agents_real(discussion, view_def=None, include_email=False):
    agents = AgentProfile.db().query(AgentProfile)
    if include_email:
        agents = agents.options(joinedload(AgentProfile.email_accounts))
    # TODO: Only those in the discussion...
    # look at permissions, posts, extracts... argh!
    def view(agent):
        if view_def:
            result = agent.generic_json(view_def)
        else:
            result = agent.serializable()
        if include_email:
            result['email'] = agent.get_preferred_email()
        return result
    return [view(agent) for agent in agents]

@agents.get(permission=P_READ)
def get_agents(request, discussion_only=False):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get(int(discussion_id))
    if not discussion:
        raise HTTPNotFound("Discussion with id '%s' not found." % discussion_id)
    view_def = request.GET.get('view')
    return _get_agents_real(discussion=discussion, view_def=view_def)

@agent.get(permission=P_READ)
def get_agent(request):
    view_def = request.GET.get('view')
    agent_id = request.matchdict['id']
    agent = AgentProfile.get_instance(agent_id)

    if not agent:
        raise HTTPNotFound("Agent with id '%s' not found." % agent_id)

    if view_def:
        return agent.generic_json(view_def)
    else:
        return agent.serializable()
