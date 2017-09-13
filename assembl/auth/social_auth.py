"""The Assembl-specific configuration of PythonSocialAuth_

.. _PythonSocialAuth: http://psa.matiasaguirre.net/
"""
import re
from datetime import datetime
import logging

from pyramid.events import subscriber, BeforeRender
from pyramid.security import (
    remember,
    forget,
    Everyone,
    authenticated_userid)
from pyramid.config import aslist
import simplejson as json

from social.apps.pyramid_app.utils import backends
from social.strategies.pyramid_strategy import PyramidStrategy
from social.utils import to_setting_name, setting_name, SETTING_PREFIX
from social.exceptions import AuthException
from social.backends.utils import load_backends

from assembl.models import (
    User, Preferences, AbstractAgentAccount, IdentityProvider)
from .util import (
    discussion_from_request, maybe_auto_subscribe, effective_userid,
    get_user)


log = logging.getLogger('assembl')

def login_user(backend, user, user_social_auth):
    remember(backend.strategy.request, user.id)


def login_required(request):
    logged_in = effective_userid(request)
    return logged_in is None


@subscriber(BeforeRender)
def add_social(event):
    request = event['request']
    event['social'] = backends(request, request.user)


def user_details(
        strategy, details, response, social=None, *args, **kwargs):
    if social:
        social.interpret_social_auth_details(details)
        social.set_extra_data(response)
        if social.verified:
            social.profile.verified = True


def associate_by_email(backend, details, provider=None, user=None, *args, **kwargs):
    """
    Find other users of the same email. One of them may be appropriate.

    Taken from social.pipeline.social_auth.associate_by_email and rewritten
    """
    email = details.get('email')
    provider = IdentityProvider.get_by_type(backend.name)
    if email and provider.trust_emails:
        # Try to associate accounts registered with the same email address,
        # only if it's a single object. AuthException is raised if multiple
        # objects are returned.
        users = list(backend.strategy.storage.user.get_users_by_email(email))
        if user and user not in users:
            users.insert(0, user)
        if len(users) == 0:
            return None
        user = users.pop(0)
        if not isinstance(user, User):
            # Assume it's safe to upgrade to user status already
            user = user.change_class(User, None, verified=True)
        return {'user': user, "other_users": users}


def maybe_merge(
        backend, details, user=None, other_users=None,
        *args, **kwargs):
    # If we do not already have a user, see if we're in a situation
    # where we're adding an account to an existing user, and maybe
    # even merging
    request = backend.strategy.request
    adding_account = request.session.get("add_account", None)
    if adding_account is not None:
        del request.session["add_account"]
    # current discussion and next?
    logged_in = authenticated_userid(request)
    if logged_in:
        logged_in = User.get(logged_in)
        if adding_account:
            if user and user != logged_in:
                # logged_in presumably newer?
                logged_in.merge(user)
                logged_in.db.delete(user)
                logged_in.db.flush()
            user = logged_in
        else:
            forget(request)
            user = None
            logged_in = None
    if other_users:
        if not user:
            user = other_users.pop(0)
        # Merge other accounts with same verified email
        for profile in other_users:
            user.merge(profile)
            profile.delete()
    return {"user": user}


def associate_user(backend, uid, user=None, social=None, details=None,
                   *args, **kwargs):
    from social.pipeline.social_auth import \
        associate_user as psa_associate_user
    results = psa_associate_user(
        backend, uid, user, social, *args, **kwargs)
    # Delete old email accounts
    email = (details or {}).get('email', None)
    if email and results and results['new_association']:
        for acc in user.email_accounts:
            if acc.email_ci == email:
                acc.delete()
    return results


def auto_subscribe(backend, social, user, *args, **kwargs):
    if not user:
        return
    if user and social.email:
        # Remove pure-email account if found social.
        for email_account in user.email_accounts:
            if email_account.email_ci == social.email:
                social.verified |= email_account.verified
                email_account.delete()
                break
    request = backend.strategy.request
    discussion = discussion_from_request(request)
    if discussion:
        user.last_login = datetime.utcnow()
        maybe_auto_subscribe(user, discussion)
        return {"discussion": discussion}


def print_details(backend, details, *args, **kwargs):
    print details, args, kwargs


class AssemblStrategy(PyramidStrategy):

    def request_is_secure(self):
        return self.request.scheme == 'https'

    def request_path(self):
        return self.request.path

    def request_port(self):
        return self.request.host_port

    def request_get(self):
        return self.request.GET

    def request_post(self):
        return self.request.POST

    def get_preferences(self):
        discussion = discussion_from_request(self.request)
        if discussion:
            return discussion.preferences
        else:
            return Preferences.get_default_preferences()

    def get_setting(self, name):
        """Return value for given setting name. May extract from discussion prefs"""
        # TODO: Add WHITELISTED_DOMAINS
        if name.split("_")[-1] in ('KEY', 'SECRET', 'SERVER'):
            prefs = self.get_preferences()
            backend = prefs["authorization_server_backend"]
            if backend:
                m = re.match((
                    r"^(?:SOCIAL_AUTH_)?(?:%s_)?(KEY|SECRET|SERVER)$"
                    % to_setting_name(backend)), name)
                if m:
                    val = prefs["authorization_" + m.group(1).lower()]
                    if val:
                        return val
        return super(AssemblStrategy, self).get_setting(name)

    # def partial_from_session(self, session):
    #     from social.pipeline.utils import partial_from_session
    #     return partial_from_session(self, session)

    def get_pipeline(self):
        return (
            # Optional step: print details so we see what's going on
            # 'assembl.auth.social_auth.print_details',

            # Get the information we can about the user and return it in a simple
            # format to create the user instance later. On some cases the details are
            # already part of the auth response from the provider, but sometimes this
            # could hit a provider API.
            'social.pipeline.social_auth.social_details',

            # Get the social uid from whichever service we're authing thru. The uid is
            # the unique identifier of the given user in the provider.
            'social.pipeline.social_auth.social_uid',

            # Verifies that the current auth process is valid within the current
            # project, this is were emails and domains whitelists are applied (if
            # defined).
            'social.pipeline.social_auth.auth_allowed',

            # Checks if the current social-account is already associated in the site.
            'social.pipeline.social_auth.social_user',

            # Make up a username for this person, appends a random string at the end if
            # there's any collision.
            'social.pipeline.user.get_username',

            # Send a validation email to the user to verify its email address.
            # 'social.pipeline.mail.mail_validation',

            # Associates the current social details with another user account with
            # a similar email address.
            'assembl.auth.social_auth.associate_by_email',

            # If we do not already have a user, see if we're in a situation
            # where we're adding an account to an existing user, and maybe
            # even merging. We may also forget the logged in user.
            'assembl.auth.social_auth.maybe_merge',

            # Create a user account if we haven't found one yet.
            'social.pipeline.user.create_user',

            # Create the record that associated the social account with this user.
            'assembl.auth.social_auth.associate_user',

            # Autosubscribe if appropriate
            'assembl.auth.social_auth.auto_subscribe',

            # Populate the extra_data field in the social record with the values
            # specified by settings (and the default ones like access_token, etc).
            'social.pipeline.social_auth.load_extra_data',

            # Update the user record with any changed info from the auth service.
            'assembl.auth.social_auth.user_details'
        )


def get_active_auth_strategies(settings):
    """Give the list of available social auth providers.
    Includes multiple instances if a provider can have multiple servers.
    This currently includes SAML, and eventually wordpress.
    TODO: Should replace the login_providers config variable"""
    all_backends = load_backends(settings.get('SOCIAL_AUTH_AUTHENTICATION_BACKENDS'))
    for backend_name in all_backends:
        def get_setting(name):
            return (settings.get(setting_name(SETTING_PREFIX, backend_name, name), None)
                    or settings.get(setting_name(backend_name, name), None))
        if backend_name == 'wordpress-oauth2':
            # TODO: This special case needs to be treated the same as saml asap.
            # Also: maybe check preferences
            yield backend_name
        elif backend_name == 'saml':
            # special case: Multiple IDPs
            idps = get_setting('ENABLED_IDPS') or {}
            for idp in idps.keys():
                yield 'saml:' + idp
        elif get_setting('key'):
            yield backend_name


def includeme(config):
    """Pre-parse certain settings for python_social_auth, then load it."""
    settings = config.get_settings()
    settings['login_providers'] = aslist(settings.get('login_providers', ''))
    settings['trusted_login_providers'] = aslist(settings.get('trusted_login_providers', ''))
    if not any(settings['login_providers']):
        log.warning('no login providers configured, double check '
                         'your ini file and add a few')
    for name in ('SOCIAL_AUTH_AUTHENTICATION_BACKENDS',
                 'SOCIAL_AUTH_USER_FIELDS',
                 'SOCIAL_AUTH_PROTECTED_USER_FIELDS',
                 'SOCIAL_AUTH_FIELDS_STORED_IN_SESSION'):
        settings[name] = aslist(settings.get(name, ''))
    for name in ('SOCIAL_AUTH_SAML_ORG_INFO',
                 'SOCIAL_AUTH_SAML_TECHNICAL_CONTACT',
                 'SOCIAL_AUTH_SAML_SUPPORT_CONTACT',
                 'SOCIAL_AUTH_SAML_ENABLED_IDPS'):
        val = settings.get(name, '')
        if val:
            settings[name] = json.loads(val)
    for k in settings.iterkeys():
        if k.endswith("_SCOPE") and k.startswith("SOCIAL_AUTH_"):
            settings[k] = aslist(settings.get(k, ''))
    config.add_request_method(
        'assembl.auth.social_auth.get_user', 'user', reify=True)
