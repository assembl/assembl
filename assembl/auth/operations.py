from gettext import gettext as _

from pyramid_mailer import get_mailer
from pyramid_mailer.message import Message

from assembl.lib import config
from models import IdentityProvider, EmailAccount
from ..db import DBSession
from .password import email_token, verify_password


def get_identity_provider(auth_context, create=True):
    provider = None
    provider = DBSession.query(IdentityProvider).filter_by(
        provider_type=auth_context.provider_type,
        name=auth_context.provider_name
        ).first()
    if create and not provider:
        provider = IdentityProvider(
            provider_type=auth_context.provider_type,
            name=auth_context.provider_name)
        DBSession.add(provider)
    return provider


# TODO: Use Jinja?

confirm_email = u'''Hello, {name}!
Please confirm your {confirm_what} <{email}> with Assembl by clicking on the link below.
<{confirm_url}>
'''

confirm_email_html = u'''<p>Hello, {name}!</p>
<p>Please <a href="{confirm_url}">confirm your {confirm_what}</a> &lt;{email}&gt; with Assembl.</p>
'''


def send_confirmation_email(request, email, deferred=True):
    mailer = get_mailer(request)
    confirm_what = _('email')
    if email.profile.user and not email.profile.user.verified:
        confirm_what = _('account')
    data = {
        'name': email.profile.name,
        'email': email.email,
        'confirm_what': confirm_what,
        'confirm_url': request.route_url('user_confirm_email',
                                         ticket=email_token(email))
    }
    message = Message(
        subject=_("Please confirm your email with Assembl"),
        sender=config.get('assembl.admin_email'),
        recipients=["%s <%s>" % (email.profile.name, email.email)],
        body=_(confirm_email).format(**data),
        html=_(confirm_email_html).format(**data))
    if deferred:
        mailer.send_to_queue(message)
    else:
        mailer.send(message)


def verify_email_token(token):
    id, hash = token.split('f', 1)
    email = DBSession.query(EmailAccount).get(int(id))
    if email and verify_password(
        str(email.id) + email.email + config.get(
            'security.email_token_salt'), hash, True):
            return email
