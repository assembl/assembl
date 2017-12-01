from urllib import urlencode

from simplejson import loads
from social.backends.base import BaseAuth

from .encryption import MediactiveAESDecrypter



class Mediactive(BaseAuth):
    name = 'mediactive'
    USERNAME_KEY = 'username'

    def auth_url(self):
        """Must return redirect URL to auth provider"""
        next_url = self.data.get('next', None)
        base = self.setting('LOGIN_URL')
        if next_url:
            base += '?' + urlencode({'next': next_url})
        return base

    def get_user_id(self, details, response):
        """Return current user id."""
        return response['id']

    def get_user_details(self, response):
        """Return user basic information (id and email only)."""
        return {'email': response['email'],
                'first_name': response['firstname'].title(),
                'last_name': response['lastname'].title()}

    def auth_complete(self, *args, **kwargs):
        """Completes login process, must return user instance."""
        mediactiveDecrypter = MediactiveAESDecrypter(self.setting('SECRET'))
        data = loads(mediactiveDecrypter.decrypt(self.data['data']))
        kwargs.update({'response': data, 'backend': self})
        return self.strategy.authenticate(*args, **kwargs)
