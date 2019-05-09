from social_core.oauth.backends.oauth import BaseOAuth2
from social_core.oauth.utils import handle_http_errors


class DecathlonOAuth(BaseOAuth2):
    """
    Decathlon OAuth authentication backend.
    TODO: Get Docs Address
    """
    name = 'decathlon'
    # put these in a configuration file
    client_id = ''
    AUTHORIZATION_URL = ''

    ACCESS_TOKEN_METHOD = 'POST'
    SCOPE_SEPARATOR = ' '  # What is their scope seperator?
    EXTRA_DATA = []  # Any extra data that's wanted?

    def get_user_id(self, details, response):
        """Return user unique id provided by service"""
        return response['account'].get('id')

    def get_user_details(self, response):
        """Return user details from Decathlon account"""
        print response
        fullname, first_name, last_name = self.get_user_names(
            response.get('name') or '')

        return {'username': response['account'].get('email'),
                'email': response['account'].get('email'),
                'fullname': fullname,
                'first_name': first_name,
                'last_name': last_name}

    @handle_http_errors
    def auth_complete(self, *args, **kwargs):
        """Completes login process, must return user instance"""
        print "[Decathlon][auth_complete] %s " % self.data
        self.process_error(self.data)
        # Implicit flow doesn't make API call
        token = self.data['access_token'] or ''
        return self.do_auth(token, *args, **kwargs)
