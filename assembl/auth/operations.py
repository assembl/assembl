from datetime import datetime, timedelta

from pyramid.i18n import get_localizer, TranslationStringFactory
from pyramid_mailer import get_mailer
from pyramid_mailer.message import Message

from assembl.lib import config
from ..models import IdentityProvider, EmailAccount, User
from ..models import get_session_maker
from .password import email_token, verify_password, password_token

_ = TranslationStringFactory('assembl')


def get_identity_provider(request, create=True):
    auth_context = request.context
    trusted = request.registry.settings['trusted_login_providers']
    provider = None
    session = get_session_maker()()
    provider = IdentityProvider.db.query(IdentityProvider).filter_by(
        provider_type=auth_context.provider_type,
        name=auth_context.provider_name
    ).first()
    if provider and not provider.trust_emails and provider.name in trusted:
        provider.trust_emails = True
        session.add(provider)
    elif create and not provider:
        provider = IdentityProvider(
            provider_type=auth_context.provider_type,
            name=auth_context.provider_name,
            trust_emails=auth_context.provider_name in trusted)
        session.add(provider)
    return provider


def send_confirmation_email(request, email):
    mailer = get_mailer(request)
    localizer = get_localizer(request)
    confirm_what = _('email')
    if isinstance(email.profile, User) and not email.profile.verified:
        confirm_what = _('account')
    data = {
        'name': email.profile.name,
        'email': email.email,
        'assembl': "Assembl",
        'confirm_what': localizer.translate(confirm_what),
        'confirm_url': request.route_url('user_confirm_email',
                                         ticket=email_token(email))
    }
    message = Message(
        subject=localizer.translate(_('confirm_title', default="Please confirm your ${confirm_what} with <${assembl}>", mapping=data)),
        sender=config.get('assembl.admin_email'),
        recipients=["%s <%s>" % (email.profile.name, email.email)],
        body=localizer.translate(_('confirm_email', default=u"""Hello, ${name}!
Please confirm your ${confirm_what} <${email}> with ${assembl} by clicking on the link below.
<${confirm_url}>
""", mapping=data)),
        html=localizer.translate(_('confirm_email_html', default=u"""<p>Hello, ${name}!</p>
<p>Please <a href="${confirm_url}">confirm your ${confirm_what}</a> &lt;${email}&gt; with <${assembl}>.</p>
""", mapping=data)))
    #if deferred:
    #    mailer.send_to_queue(message)
    #else:
    mailer.send(message)

def send_change_password_email(request, profile, email=None):
    mailer = get_mailer(request)
    localizer = get_localizer(request)
    data = dict(
        name=profile.name, confirm_url=request.route_url(
            'do_password_change', ticket=password_token(profile)),
        assembl="Assembl")
    message = Message(
        subject=localizer.translate(_('confirm_password_title', default="Request for password change", mapping=data)),
        sender=config.get('assembl.admin_email'),
        recipients=["%s <%s>" % (profile.name, email or profile.get_preferred_email())],
        body=localizer.translate(_('confirm_password_txt', default=u"""Hello, ${name}!
You asked to change your password on <${assembl}>. (We hope it was you!)\n
You can do this by clicking on the link below.
<${confirm_url}>
""", mapping=data)),
        html=localizer.translate(_('confirm_password_html', default=u"""<p>Hello, ${name}!</p>
<p>You asked to <a href="${confirm_url}">change your password</a> on ${assembl} (We hope it was you!)</p>
""", mapping=data)))
    #if deferred:
    #    mailer.send_to_queue(message)
    #else:
    mailer.send(message)



def verify_email_token(token):
    id, hash = token.split('f', 1)
    email = EmailAccount.get(id=int(id))
    if email and verify_password(
        str(email.id) + email.email + config.get(
            'security.email_token_salt'), hash, True):
            return email


def verify_password_change_token(token, duration):
    id, hash = token.split('e', 1)
    id = int(id)
    user = User.get(id=id)
    if not user:
        return False, None
    age = datetime.now() - user.last_login
    if age > timedelta(duration/24.0):
        return False, id
    check = str(id)+user.last_login.isoformat()[:19]
    valid = verify_password(
        check, hash, True)
    if not valid:
        return False, id
    return True, id
