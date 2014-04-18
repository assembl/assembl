from pyramid.i18n import get_localizer, TranslationStringFactory
from pyramid_mailer import get_mailer
from pyramid_mailer.message import Message

from assembl.lib import config
from ..models import IdentityProvider, EmailAccount, User
from ..models import get_session_maker
from .password import email_token, verify_password

_ = TranslationStringFactory('assembl')

def get_identity_provider(auth_context, create=True):
    provider = None
    session = get_session_maker()()
    provider = IdentityProvider.db.query(IdentityProvider).filter_by(
        provider_type=auth_context.provider_type,
        name=auth_context.provider_name
        ).first()
    if create and not provider:
        provider = IdentityProvider(
            provider_type=auth_context.provider_type,
            name=auth_context.provider_name)
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
        'confirm_what': localizer.translate(confirm_what),
        'confirm_url': request.route_url('user_confirm_email',
                                         ticket=email_token(email))
    }
    message = Message(
        subject=localizer.translate(_('confirm_title', default="Please confirm your ${confirm_what} with Assembl", mapping=data)),
        sender=config.get('assembl.admin_email'),
        recipients=["%s <%s>" % (email.profile.name, email.email)],
        body=localizer.translate(_('confirm_email', default=u"""Hello, ${name}!
Please confirm your ${confirm_what} <${email}> with Assembl by clicking on the link below.
<${confirm_url}>
""", mapping=data)),
        html=localizer.translate(_('confirm_email_html', default=u"""<p>Hello, ${name}!</p>
<p>Please <a href="${confirm_url}">confirm your ${confirm_what}</a> &lt;${email}&gt; with Assembl.</p>
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
