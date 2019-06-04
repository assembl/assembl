from urllib import urlencode
from urlparse import urlparse, urlunparse, parse_qs
from HTMLParser import HTMLParser

from simplejson import loads
from social_core.backends.base import BaseAuth

from .encryption import MediactiveAESCryptor
from assembl.lib.logging import getLogger

log = getLogger('assembl')


def clean(html_parser, s):
    return html_parser.unescape(s).title()


class Mediactive(BaseAuth):
    """A simple SocialAuth backend agreed to with Mediactive.
    Security is based on a shared secret key.

    In order to activate, must add the following keys to the settings:
    SOCIAL_AUTH_AUTHENTICATION_BACKENDS:    Add this class, eg. assembl.auth.mediactive.Mediactive
    SOCIAL_AUTH_MEDIACTIVE_SECRET:          The shared secret key
    SOCIAL_AUTH_MEDIACTIVE_LOGOUT_URL:      The logout URL
    SOCIAL_AUTH_MEDIACTIVE_KEY:             An unused key, but presence needed. Typically, put `unused`
    SOCIAL_AUTH_MEDIACTIVE_LOGIN_URL:       The login URL, including the `next` query_string
    """
    name = 'mediactive'
    USERNAME_KEY = 'username'
    html_parser = HTMLParser()

    def auth_url(self):
        """Must return redirect URL to auth provider"""
        next_url = self.data.get('next', None)
        base = self.setting('LOGIN_URL')
        if next_url:
            pr = urlparse(base)
            qs = parse_qs(pr.query)
            qs['next'] = [next_url]
            base = urlunparse(pr._replace(query=urlencode(qs, True)))
        return base

    def get_user_id(self, details, response):
        """Return current user id."""
        return response['id']

    def get_user_details(self, response):
        """Return user basic information (id and email only)."""
        return {'email': response['email'],
                'first_name': clean(self.html_parser, response['firstname']),
                'last_name': clean(self.html_parser, response['lastname'])}

    def auth_complete(self, *args, **kwargs):
        """Completes login process, must return user instance."""
        mediactiveDecrypter = MediactiveAESCryptor(self.setting('SECRET'))
        data = loads(mediactiveDecrypter.decrypt(self.data['data']))
        kwargs.update({'response': data, 'backend': self})
        return self.strategy.authenticate(*args, **kwargs)

    @classmethod
    def get_display_name(cls, data):
        """
        Business logic of the forced display name of the user in Assembl
        """
        try:
            first_name = clean(cls.html_parser, data['firstname'])
            if first_name:
                first_name = first_name.lower()
            last_name = clean(cls.html_parser, data['lastname'])
            if last_name:
                last_name = last_name.lower()[0]
            return "%s.%s" % (first_name, last_name)
        except Exception:
            log.error("[Mediactive Backend] Failed to populate extra data for social user with data %s" % data)
            return None

    def display_name(self, response):
        return Mediactive.get_display_name(response)

    def extra_data(self, user, uid, response, details=None, *args, **kwargs):
        data = super(Mediactive, self).extra_data(user, uid, response,
                                                  details=details,
                                                  *args, **kwargs)
        # Force the display name on assembl
        name = self.display_name(response)
        if name:
            data['forced_display_name'] = name
        return data


class EDFMediactive(Mediactive):
    name = 'edf-mediactive'

    @classmethod
    def get_display_name(cls, data):
        # No custom display name for EDF
        return None
