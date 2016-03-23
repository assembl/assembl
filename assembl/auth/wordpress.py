"""
Mail.ru OAuth2 backend, docs at:
    http://psa.matiasaguirre.net/docs/backends/mailru.html
"""
from hashlib import md5

from social.p3 import unquote
from social.backends.oauth import BaseOAuth2


class WordPressServerOAuth2(BaseOAuth2):
    """WordPressServer authentication backend"""
    name = 'wordpress-oauth2'
    ID_KEY = 'ID'

    def __init__(self, strategy=None, redirect_uri=None):
        self.server = strategy.get_setting("WORDPRESS_OAUTH2_SERVER")
        self.AUTHORIZATION_URL = self.server + 'authorize'
        self.ACCESS_TOKEN_URL = self.server + 'token'
        self.USER_DATA_URL = self.server + 'me'
        super(WordPressServerOAuth2, self).__init__(
            strategy=strategy, redirect_uri=redirect_uri)

    def get_provider_domain(self):
        return self.server

    ACCESS_TOKEN_METHOD = 'POST'
    DEFAULT_SCOPE = ['profile', 'email']  # phone address
    # EXTRA_DATA = [('refresh_token', 'refresh_token'),
    #               ('expires_in', 'expires')]

    def get_user_details(self, response):
        """Return user details from WordPress request"""
        # print response
        # {'user_status': '0',
        #  'display_name': 'maparent',
        #  'access_token': '...',
        #  'user_login': 'maparent',
        #  'expires_in': 3600,
        #  'user_nicename': 'maparent',
        #  'token_type': 'Bearer',
        #  'user_registered': '2016-02-08 16:23:19',
        #  'user_email': 'maparent@acm.org',
        #  'scope': 'basic',
        #  'ID': '1',
        #  'email': 'maparent@acm.org',
        #  'refresh_token': '....'}
        # display_name could be anything, but is often the full name.
        # No guarantee of having first/last name.
        display_name = self.get_user_names(unquote(response['display_name']))
        return {'username': unquote(response['user_login']),
                'email': unquote(response['user_email']),
                'fullname': display_name[0]}

    def user_data(self, access_token, *args, **kwargs):
        """Loads user data from service"""
        client_id, client_secret = self.get_key_and_secret()
        response = kwargs.pop('response')
        print "user_data", response
        # import pdb; pdb.set_trace()

        r = self.get_json(
            self.USER_DATA_URL,
            params={"access_token": access_token}
        )
        return r
