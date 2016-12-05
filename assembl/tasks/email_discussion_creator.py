
from email.header import Header

from zope import interface
from pyramid.i18n import TranslationStringFactory
from pyramid.threadlocal import get_current_request
from pyramid_mailer import get_mailer
from pyramid_mailer.message import Message
from pyramid.settings import aslist

from assembl.lib import config
from assembl.lib.discussion_creation import IDiscussionCreationCallback
from assembl.lib.utils import normalize_email_name
from assembl.auth.password import password_change_token


_ = TranslationStringFactory('assembl')


class EmailCreatorAtDiscussionCreation(object):
    """A :py:class:`IDiscussionCreationCallback` that emails the discussion creator
    with various relevant links. Cc is sent to emails in the config's
    discussion_creation_cc. (TODO: preference?)
    """
    interface.implements(IDiscussionCreationCallback)

    def discussionCreated(self, discussion):
        from assembl.models import Notification
        from ..lib.frontend_urls import FrontendUrls
        from premailer import Premailer
        profile = discussion.creator
        assert profile
        jinja_env = Notification.make_jinja_env()
        (assembl_css, ink_css) = Notification.get_css_paths(discussion)
        request = get_current_request()
        confirm_url = request.route_url(
            'contextual_welcome',
            discussion_slug=discussion.slug,
            ticket=password_change_token(profile))
        template_data = {
            'discussion': discussion,
            'frontendUrls': FrontendUrls(discussion),
            'ink_css': ink_css.read(),
            'assembl_notification_css': assembl_css.read().decode('utf_8'),
            'jinja_env': jinja_env,
            'connection_url': confirm_url,
            'documentation_url': config.get('documentation_url'),
            'admin_email': config.get('admin_email'),
            'admin_name': config.get('admin_name'),
            'admin_org_name': config.get('admin_org_name'),
            'admin_org_url': config.get('admin_org_url'),
        }
        html_template = jinja_env.get_template(
            'notifications/html_new_discussion.jinja2')
        html_body = html_template.render(**template_data)
        html_body = Premailer(html_body, disable_leftover_css=True).transform()
        text_template = jinja_env.get_template(
            'notifications/txt_new_discussion.jinja2')
        text_body = text_template.render(**template_data)
        sender_email = config.get('assembl.admin_email')
        mailer = get_mailer(request)
        localizer = request.localizer
        sender_name = discussion.topic
        sender_name = normalize_email_name(sender_name)
        sender = '"%s" <%s>' % (sender_name, sender_email)
        sender_name = Header(sender_name, 'utf-8').encode()
        if len(sender) > 255:
            sender = sender_email
        subject = localizer.translate(_("Your consultation was created"))
        message = Message(
            subject=subject,
            sender=sender,
            recipients=["%s <%s>" % (
                profile.name, profile.get_preferred_email())],
            cc=aslist(config.get("discussion_creation_cc", "")),
            body=text_body,
            html=html_body)
        mailer.send(message)
