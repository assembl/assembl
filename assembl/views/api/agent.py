from pyramid.httpexceptions import HTTPNotFound
from pyramid.security import authenticated_userid
from sqlalchemy.orm import joinedload
from cornice import Service

from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.auth import P_READ
from assembl.models import Discussion, AgentProfile, User


agents = Service(
    name='agents',
    path=API_DISCUSSION_PREFIX + '/agents/',
    description="Retrieve a discussion's agents.",
    renderer='json')

agent = Service(
    name='agent', path=API_DISCUSSION_PREFIX + '/agents/{id:.+}',
    description="Retrieve a single agent", renderer='json')

user = Service(
    name='user', path=API_DISCUSSION_PREFIX + '/user/{id:.+}',
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

@user.get(permission=P_READ)
def get_user(request):
    user_id = request.matchdict['id']
    #user = AgentProfile.get_instance(user_id)
    session = AgentProfile.db
    logged_in = authenticated_userid(request)

    try:
        id = int(user_id)
    except:
      raise HTTPNotFound()
    profile = session.query(AgentProfile).get(id)

    unverified_emails = [
        (ea, session.query(EmailAccount).filter_by(
            email=ea.email, verified=True).first())
        for ea in profile.email_accounts if not ea.verified]

    return dict(
      the_user=profile,
      unverified_emails=unverified_emails,
      user=session.query(User).get(logged_in)) 

        



