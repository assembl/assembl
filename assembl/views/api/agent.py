from pyisemail import is_email
from pyramid.httpexceptions import HTTPNotFound, HTTPUnauthorized, HTTPFound
from pyramid.security import authenticated_userid
from pyramid.i18n import TranslationStringFactory
from sqlalchemy.orm import joinedload
from cornice import Service

from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.auth import (P_READ, Everyone, P_SYSADMIN, P_ADMIN_DISC)
from assembl.auth.util import get_permissions
from assembl.models import (
    Discussion, AgentProfile, EmailAccount, User, Username)

from .. import get_default_context

_ = TranslationStringFactory('assembl')

agents = Service(
    name='agents',
    path=API_DISCUSSION_PREFIX + '/agents/',
    description="Retrieve a discussion's agents.",
    renderer='json')

agent = Service(
    name='agent', path=API_DISCUSSION_PREFIX + '/agents/{id:.+}',
    description="Retrieve a single agent", renderer='json')


def _get_agents_real(discussion, user_id=Everyone, view_def='default'):
    agents = discussion.get_participants_query()
    permissions = get_permissions(user_id, discussion.id)
    include_emails = P_ADMIN_DISC in permissions or P_SYSADMIN in permissions
    if include_emails:
        agents = agents.options(joinedload(AgentProfile.accounts))

    def view(agent):
        result = agent.generic_json(view_def, user_id, permissions)
        if result is None:
            return
        if include_emails or agent.id == user_id:
            result['preferred_email'] = agent.get_preferred_email()
        return result
    return [view(agent) for agent in agents if agent is not None]


@agents.get(permission=P_READ)
def get_agents(request, discussion_only=False):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get(int(discussion_id))
    if not discussion:
        raise HTTPNotFound("Discussion with id '%s' not found." % discussion_id)
    view_def = request.GET.get('view')
    return _get_agents_real(
        discussion, authenticated_userid(request), view_def)


@agent.get(permission=P_READ)
def get_agent(request):
    view_def = request.GET.get('view') or 'default'
    agent_id = request.matchdict['id']
    agent = AgentProfile.get_instance(agent_id)

    if not agent:
      raise HTTPNotFound("Agent with id '%s' not found." % agent_id)
    discussion_id = int(request.matchdict['discussion_id'])
    user_id = authenticated_userid(request)
    permissions = get_permissions(user_id, discussion_id)

    agent_json = agent.generic_json(view_def, user_id, permissions)
    current_user = authenticated_userid(request)
    if current_user == agent.id:
        # We probably should add all profile info here.
        agent_json['preferred_email'] = agent.get_preferred_email()
    return agent_json


@agent.put()
def post_agent(request):
    agent_id = request.matchdict['id']
    agent = AgentProfile.get_instance(agent_id)
    current_user = authenticated_userid(request)
    if current_user != agent.id:
        # Only allow post by self.
        raise HTTPUnauthorized()
    redirect = False
    username = request.params.get('username', '').strip()
    session = AgentProfile.default_db
    localizer = request.localizer
    errors = []

    if username and (
            agent.username is None or username != agent.username):
        # check if exists
        if session.query(Username).filter_by(username=username).count():
            errors.append(localizer.translate(_(
                'The username %s is already used')) % (username,))
        else:
            old_username = agent.username
            if old_username is not None:
                # free existing username
                session.delete(old_username)
                session.flush()
            # add new username
            session.add(Username(username=username, user=agent))

    name = request.params.get('name', '').strip()
    if name:
        agent.name = name

    p1, p2 = (request.params.get('password1', '').strip(),
              request.params.get('password2', '').strip())
    if p1 != p2:
        errors.append(localizer.translate(_(
            'The passwords are not identical')))
    elif p1:
        agent.password_p = p1
    add_email = request.params.get('add_email', '').strip()
    if add_email:
        if not is_email(add_email):
            return dict(get_default_context(request),
                        error=localizer.translate(_(
                            "This is not a valid email")))
        # No need to check presence since not validated yet
        email = EmailAccount(
            email=add_email, profile=agent)
        session.add(email)
    if redirect:
        return HTTPFound(location=request.route_url(
            'profile_user', type='u', identifier=username))
    profile = session.query(User).get(agent_id)
    return {}
