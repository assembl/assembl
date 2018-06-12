"""The Assembl-specific configuration of PythonSocialAuth_

.. _PythonSocialAuth: http://psa.matiasaguirre.net/
"""
import re
import logging

from pyramid.events import subscriber, BeforeRender
from pyramid.security import remember, forget
from pyramid.config import aslist
import simplejson as json

from social_pyramid.utils import backends
from social_pyramid.strategy import PyramidStrategy
from social_core.utils import to_setting_name, setting_name, SETTING_PREFIX

from assembl.models import User, Preferences, IdentityProvider
from .util import discussion_from_request, maybe_auto_subscribe
from ..lib import config
from .generic_auth_backend import load_backends, GenericAuth


log = logging.getLogger('assembl')


def login_user(backend, user, user_social_auth):
    remember(backend.strategy.request, user.id)


def login_required(request):
    logged_in = request.authenticated_userid
    return logged_in is None


def get_user(request):
    user_id = request.authenticated_userid
    if user_id:
        user = User.default_db.query(
            User).filter(User.id == user_id).first()
    else:
        user = None
    return user


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

    Taken from social_core.pipeline.social_auth.associate_by_email and rewritten
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


def social_user(backend, uid, user=None, *args, **kwargs):
    """Get the social account using the UID.
    replaces social.pipeline.social_auth.social_user,
    because it always uses the social account's user
    versus a previous connection user."""
    provider = backend.name
    social = backend.strategy.storage.user.get_social_auth(
        provider, uid)
    user = social.user if social else None
    return {'social': social,
            'user': user,
            'is_new': user is None,
            'new_association': False}


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
    logged_in = request.authenticated_userid
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
    results = None
    if not social:
        from social_core.pipeline.social_auth import \
            associate_user as psa_associate_user
        results = psa_associate_user(
            backend, uid, user, social, *args, **kwargs)
        # User has logged in with this account
        social = results.get('social', social)
    if social:
        social.successful_login()
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
    # Maybe discussion slug is in the 'next' parameter
    if not discussion:
        next_param = request.GET.get('next', request.POST.get('next', None))
        if next_param:
            next_param = next_param.strip('/').split('/')
            if (len(next_param) == 2 and
                    next_param[1] == 'home' or next_param[0] == 'debate'):
                from assembl.models import Discussion
                slug = next_param[0] if next_param[1] == 'home' else next_param[1]
                discussion = Discussion.default_db.query(
                    Discussion).filter_by(slug=slug).first()
    if discussion:
        user.successful_social_login()
        check_subscription = discussion.preferences['whitelist_on_authentication_backend']
        maybe_auto_subscribe(user, discussion, check_authorization=check_subscription)
        return {"discussion": discussion}


def print_details(backend, details, *args, **kwargs):
    print details, args, kwargs


def maybe_social_logout(request):
    """If the user has a an account with the default social provider,
    and that account has a logout URL, redirect there.
    Maybe the next argument should be carried?"""
    discussion = discussion_from_request(request)
    if not discussion:
        return
    backend_name = discussion.preferences['authorization_server_backend']
    if not backend_name:
        return
    user_id = request.authenticated_userid
    if not user_id:
        return
    user = User.get(user_id)
    for account in user.accounts:
        if getattr(account, 'provider_with_idp', None) == backend_name:
            break
    else:
        return
    # TODO: tell the account that the login has expired.
    # Also check if already expired?
    return config.get('SOCIAL_AUTH_%s_LOGOUT_URL' % (
        account.provider.upper(),))
    # Here, I thought of using the PSA disconnect.
    # But actually the default pipeline destroys the entry!
    #
    # backend_cls = get_backend(
    #     load_backends(config.get('SOCIAL_AUTH_AUTHENTICATION_BACKENDS')),
    #     account.provider)
    # strategy = load_strategy(request)
    # backend = backend_cls(strategy)
    # backend.disconnect(user=user)


class AssemblStrategy(PyramidStrategy):

    def request_is_secure(self):
        return self.request.scheme == 'https' or config.get('secure_proxy')

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
        # TODO: Obsolete code: those preferences are gone.
        if name.split("_")[-1] in ('KEY', 'SECRET', 'SERVER'):
            prefs = self.get_preferences()
            backend = prefs["authorization_server_backend"]
            if backend:
                m = re.match((
                    r"^(?:SOCIAL_AUTH_)?(?:%s_)?(KEY|SECRET|SERVER)$"
                    % to_setting_name(backend)), name)
                if m:
                    val = prefs.get("authorization_" + m.group(1).lower(), None)
                    if val is not None:
                        return val
        return super(AssemblStrategy, self).get_setting(name)

    # def partial_from_session(self, session):
    #     from social_core.pipeline.utils import partial_from_session
    #     return partial_from_session(self, session)

    def build_absolute_uri(self, path=None):
        path = super(AssemblStrategy, self).build_absolute_uri(path)
        if self.request_is_secure() and path.startswith('http:'):
            path = 'https' + path[4:]
        return path

    def get_pipeline(self, backend=None):
        return (
            # Optional step: print details so we see what's going on
            # 'assembl.auth.social_auth.print_details',

            # Get the information we can about the user and return it in a simple
            # format to create the user instance later. On some cases the details are
            # already part of the auth response from the provider, but sometimes this
            # could hit a provider API.
            'social_core.pipeline.social_auth.social_details',

            # Get the social uid from whichever service we're authing thru. The uid is
            # the unique identifier of the given user in the provider.
            'social_core.pipeline.social_auth.social_uid',

            # Verifies that the current auth process is valid within the current
            # project, this is were emails and domains whitelists are applied (if
            # defined).
            'social_core.pipeline.social_auth.auth_allowed',

            # Checks if the current social-account is already associated in the site.
            'assembl.auth.social_auth.social_user',

            # Make up a username for this person, appends a random string at the end if
            # there's any collision.
            'social_core.pipeline.user.get_username',

            # Send a validation email to the user to verify its email address.
            # 'social_core.pipeline.mail.mail_validation',

            # Associates the current social details with another user account with
            # a similar email address.
            'assembl.auth.social_auth.associate_by_email',

            # If we do not already have a user, see if we're in a situation
            # where we're adding an account to an existing user, and maybe
            # even merging. We may also forget the logged in user.
            'assembl.auth.social_auth.maybe_merge',

            # Create a user account if we haven't found one yet.
            'social_core.pipeline.user.create_user',

            # Create the record that associated the social account with this user.
            'assembl.auth.social_auth.associate_user',

            # Populate the extra_data field in the social record with the values
            # specified by settings (and the default ones like access_token, etc).
            'social_core.pipeline.social_auth.load_extra_data',

            # Update the user record with any changed info from the auth service.
            'assembl.auth.social_auth.user_details',

            # Autosubscribe if appropriate
            'assembl.auth.social_auth.auto_subscribe',
        )


def get_active_auth_strategies(settings):
    """Give the list of available social auth providers.
    Includes multiple instances if a provider can have multiple servers.
    This currently includes SAML, and eventually wordpress.
    TODO: Should replace the login_providers config variable"""
    all_backends = load_backends(settings.get('SOCIAL_AUTH_AUTHENTICATION_BACKENDS'))
    for backend_name in all_backends:
        def get_setting(name):
            return (
                settings.get(setting_name(SETTING_PREFIX, backend_name, name), None) or
                settings.get(setting_name(backend_name, name), None))
        if backend_name == 'wordpress-oauth2':
            # TODO: This special case needs to be treated the same as saml asap.
            # Also: maybe check preferences
            yield backend_name
        elif backend_name == 'saml':
            # special case: Multiple IDPs
            idps = get_setting('ENABLED_IDPS') or {}
            for idp in idps.keys():
                yield 'saml:' + idp
        elif issubclass(all_backends[backend_name], GenericAuth):
            if backend_name in settings.get('SOCIAL_AUTH_GENERICAUTH_SUBCONFIGS'):
                yield backend_name
        elif get_setting('key'):
            yield backend_name


def adjust_settings(settings):
    settings['login_providers'] = aslist(settings.get('login_providers', ''))
    settings['trusted_login_providers'] = aslist(settings.get('trusted_login_providers', ''))
    if not any(settings['login_providers']):
        log.warning('no login providers configured, double check '
                    'your ini file and add a few')
    for k, v in settings.iteritems():
        if k.startswith("SOCIAL_AUTH_"):
            if k.endswith("_SCOPE"):
                settings[k] = aslist(v)
            elif isinstance(v, (str, unicode)) and v.lstrip().startswith('{'):
                settings[k] = json.loads(v)
    for name in ('SOCIAL_AUTH_AUTHENTICATION_BACKENDS',
                 'SOCIAL_AUTH_USER_FIELDS',
                 'SOCIAL_AUTH_PROTECTED_USER_FIELDS',
                 'SOCIAL_AUTH_FIELDS_STORED_IN_SESSION'):
        settings[name] = aslist(settings.get(name, ''))


def includeme(config):
    """Pre-parse certain settings for python_social_auth, then load it."""
    adjust_settings(config.get_settings())
    config.add_request_method(
        'assembl.auth.social_auth.get_user', 'user', reify=True)
