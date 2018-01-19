from urllib import urlencode
from urlparse import urlparse, urlunparse, parse_qs
from HTMLParser import HTMLParser

from simplejson import loads
from social_core.backends.base import BaseAuth

from .encryption import MediactiveAESCryptor


class Mediactive(BaseAuth):
    """A simple SocialAuth backend agreed to with Mediactive.
    Security is based on a shared secret key."""
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

    def clean(self, s):
        return self.html_parser.unescape(s).title()

    def get_user_details(self, response):
        """Return user basic information (id and email only)."""
        return {'email': response['email'],
                'first_name': self.clean(response['firstname']),
                'last_name': self.clean(response['lastname'])}

    def auth_complete(self, *args, **kwargs):
        """Completes login process, must return user instance."""
        mediactiveDecrypter = MediactiveAESCryptor(self.setting('SECRET'))
        data = loads(mediactiveDecrypter.decrypt(self.data['data']))
        kwargs.update({'response': data, 'backend': self})
        return self.strategy.authenticate(*args, **kwargs)
