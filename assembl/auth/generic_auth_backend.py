import base64

from social_core.backends.utils import (
    get_backend, load_backends as social_load_backends, module_member)
from social_core.backends.base import BaseAuth
from social_core.backends.oauth import BaseOAuth2
import social_pyramid.utils
import jsonpath_ng
from six import string_types

from ..lib import logging

log = logging.getLogger('assembl.auth')


class GenericAuth(BaseAuth):
    """A backend which takes all its attributes from configuration file"""
    def __init__(self, strategy=None, redirect_uri=None, name=None):
        self.name = name
        super(GenericAuth, self).__init__(strategy, redirect_uri)
        data = self.setting('GENERICAUTH_SUBCONFIGS')
        assert name in data
        # override class variables with local
        self.__dict__.update(data[name])

    def setting(self, name, default=None):
        """Look in data first"""
        if name in self.__dict__:
            return getattr(self, name)
        return super(GenericAuth, self).setting(name, default)

    @staticmethod
    def extract_path(data, path):
        r = jsonpath_ng.parse(path).find(data)
        if r:
            return r[0].value
        log.warn("Could not find %s in %s" % (path, data))

    def format_json_vals(self, json, data):
        return {k: v.format(**data) if isinstance(v, string_types) else v
                for (k, v) in json.items()}

    def get_response_info(self, prop_name, response):
        # Simple case
        rPropName = self.setting(prop_name.upper() + "_PROP", None)
        if rPropName:
            return response.get(rPropName, None)
        # Complex case: use paths
        rPropName = self.setting(prop_name.upper() + "_PATH", None)
        if rPropName:
            return self.extract_path(response, rPropName)


class GenericOAuth2(GenericAuth, BaseOAuth2):
    """A Generic OAuth2 client"""

    # properties and settings from BaseAuth
    # EXTRA_DATA: None
    # REQUIRES_EMAIL_VALIDATION: False
    # SEND_USER_AGENT: False
    # SSL_PROTOCOL: None
    # properties and settings from OAuthAuth
    # AUTHORIZATION_URL: ''
    # ACCESS_TOKEN_URL: ''
    # ACCESS_TOKEN_METHOD: 'GET'
    # REVOKE_TOKEN_URL: None
    # REVOKE_TOKEN_METHOD: 'POST'
    # ID_KEY: 'id'
    # SCOPE_PARAMETER_NAME: 'scope'
    # DEFAULT_SCOPE: None
    # SCOPE_SEPARATOR: ' '
    # properties and settings from BaseOAuth2
    # REFRESH_TOKEN_URL: None
    # REFRESH_TOKEN_METHOD: 'POST'
    # RESPONSE_TYPE: 'code'
    # REDIRECT_STATE: True
    # STATE_PARAMETER: True

    def get_user_details(self, response):
        """Return user details from arbitrary account"""

        def get_response_info(prop_name):
            return self.get_response_info(prop_name, response)

        name_info = {}
        for partName in ('first_name', 'last_name', 'fullname'):
            info = get_response_info(partName)
            if info is not None:
                name_info[partName] = info
        fullname, first_name, last_name = self.get_user_names(**name_info)
        return {'username': get_response_info('username') or first_name or '',
                'email': get_response_info('email') or '',
                'fullname': fullname,
                'first_name': first_name,
                'last_name': last_name}

    def auth_headers(self):
        headers = self.setting("AUTH_HEADERS")
        if not headers:
            return super(GenericOAuth2, self).auth_headers()
        key, secret = self.get_key_and_secret()
        combo_key_secret = ':'.join((key, secret))
        b64_combo_key_secret = base64.urlsafe_b64encode(combo_key_secret)
        format_data = dict(
            key=key, secret=secret, combo_key_secret=combo_key_secret,
            b64_combo_key_secret=b64_combo_key_secret)
        return self.format_json_vals(headers, format_data)

    def user_data(self, access_token, *args, **kwargs):
        """Loads user data from service"""
        params = self.setting("USER_INFO_PARAMS")
        headers = self.setting("USER_INFO_HEADERS")
        data_subpath = self.setting("USER_INFO_SUBPATH")
        key, secret = self.get_key_and_secret()
        response = kwargs.pop('response')
        format_data = dict(
            response, access_token=access_token, key=key, secret=secret)
        if params:
            params = self.format_json_vals(params, format_data)
        if headers:
            headers = self.format_json_vals(headers, format_data)
        result = self.get_json(
            self.setting("USER_INFO_URL"),
            params=params, headers=headers
        )
        if result and data_subpath:
            return self.extract_path(result, data_subpath)
        return result


def load_backends(backends, force_load=False):
    parametrized_backends = [b for b in backends if ':' in b]
    simple_backends = [b for b in backends if ':' not in b]
    backends = social_load_backends(simple_backends)
    for fullname in parametrized_backends:
        backend, name = fullname.split(':')
        backend = module_member(backend)
        if issubclass(backend, GenericAuth):
            backends[name] = backend
    return backends


def load_backend(strategy, name, redirect_uri):
    backends = social_pyramid.utils.get_helper('AUTHENTICATION_BACKENDS')
    Backend = get_backend(backends, name)
    if issubclass(Backend, GenericAuth):
        return Backend(strategy=strategy, redirect_uri=redirect_uri, name=name)
    else:
        return Backend(strategy=strategy, redirect_uri=redirect_uri)


def includeme(config):
    """Monkey-patch load_backend."""
    social_pyramid.utils.load_backend = load_backend
