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
    # AUTHORIZATION_URL = 'http://localhost/wordpress-thecamp/oauth/authorize'
    # ACCESS_TOKEN_URL = 'http://localhost/wordpress-thecamp/oauth/token'
    # USER_DATA_URL = 'http://localhost/wordpress-thecamp/oauth/me'
    AUTHORIZATION_URL = 'https://thecampfactory.fr/oauth/authorize'
    ACCESS_TOKEN_URL = 'https://thecampfactory.fr/oauth/token'
    USER_DATA_URL = 'https://thecampfactory.fr/oauth/me'

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
                'fullname': display_name}

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
