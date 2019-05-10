from social_core.backends.oauth import BaseOAuth2
from social_core.utils import handle_http_errors
from urlparse import urljoin

from assembl.lib.config import get


class DecathlonOAuth(BaseOAuth2):
    """
    Decathlon OAuth authentication backend.
    TODO: Get Docs Address
    """
    name = 'decathlon'
    # put these in a configuration file
    client_id = get('SOCIAL_AUTH_DECATHLON_CLIENT_ID')
    BASE_AS_URL = get('SOCIAL_AUTH_DECATHLON_BASE_AS_URI')
    AUTHORIZATION_URL = urljoin(BASE_AS_URL, '/as/authorization.oauth2')

    RESPONSE_TYPE = 'token'
    SCOPE_SEPARATOR = ' '
    EXTRA_DATA = []  # Any extra data that's wanted?

    def get_user_id(self, details, response):
        """Return user unique id provided by service"""
        print "[Decathlon][get_user_id][details] %s" % details
        print "[Decathlon][get_user_id][response] %s" % response
        return response['account'].get('id')

    def get_user_details(self, response):
        """Return user details from Decathlon account"""
        print "[Decathlon][get_user_details][response] %s" % response
        details = {
            'email': response.get('mail'),
            'first_name': response.get('givenName'),
            'last_name': response.get('familyName'),
            'username': response.get('displayName')
        }

        return details.update({'fullname': ' '.join((details.get('first_name'), details.get('last_name')))})

    def user_data(self, token, *args, **kwargs):
        """Loads user data from service"""
        url = urljoin(self.BASE_AS_URL, '/idp/userinfo.openid')
        auth_header = {"Authorization": "Bearer %s" % token}
        try:
            return self.get_json(url, headers=auth_header)
        except ValueError:
            return None

    @handle_http_errors
    def auth_complete(self, *args, **kwargs):
        """Completes login process, must return user instance"""
        print "[Decathlon][auth_complete][data] %s" % self.data
        print "[Decathlon][auth_complete][args] %s" % args
        print "[Decathlon][auth_complete][kwargs] %s" % kwargs
        self.process_error(self.data)
        # Implicit flow doesn't make API call
        token = self.data['access_token'] or ''
        # TODO: Add the redirection_uri
        kwargs.update({'redirect_uri': ''})
        return self.do_auth(token, *args, **kwargs)
