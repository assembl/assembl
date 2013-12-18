import json

from pyramid.httpexceptions import HTTPNotFound
from . import acls

from cornice import Service

from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.synthesis.models import Discussion

from assembl.auth.models import (
    IdentityProvider,
    EmailAccount,
    AbstractAgentAccount,
    IdentityProviderAccount,
    AgentProfile,
    User,
    Username,
    Action,
    Role,
    Permission,
    DiscussionPermission,
    UserRole,
    LocalUserRole)


agents = Service(
    name='agents',
    path=API_DISCUSSION_PREFIX + '/agents/',
    description="Retrieve a discussion's agents.",
    renderer='json', acl=acls)

agent = Service(
    name='agent', path=API_DISCUSSION_PREFIX + '/agents/{id:.+}',
    description="Retrieve a single agent", renderer='json', acl=acls)


@agents.get()  # P_READ)
def get_agents(request, discussion_only=False):
    # discussion_id = int(request.matchdict['discussion_id'])
    # discussion = Discussion.get(id=discussion_id)
    view_def = request.GET.get('view')

    # if not discussion:
    #     raise HTTPNotFound(
    #         "Discussion with id '%s' not found." % discussion_id
    #     )
    agents = AgentProfile.db().query(AgentProfile).all()
    # TODO: Only those in the discussion...
    # look at permissions, posts, extracts... argh!

    if view_def:
        return [agent.generic_json(view_def) for agent in agents]
    else:
        return [agent.serializable() for agent in agents]


@agent.get()  # permission=P_READ)
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
