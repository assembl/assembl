# -*- coding: utf-8 -*-
from collections import OrderedDict
import urlparse

import simplejson as json
from requests import Response
import mock

from assembl.models import SocialAuthAccount


def test_assembl_login(discussion, participant1_user, test_app, request):
    url = test_app.app.request_factory({}).route_path(
        'contextual_login', discussion_slug=discussion.slug)
    # here we have to know it's "password", as the non-hashed password value
    # is not stored in the object.
    res = test_app.post(url, OrderedDict([
        ('identifier', participant1_user.get_preferred_email()),
        ('password', 'password')]))
    assert res.status_code == 302


fake_facebook_locale_info = """<?xml version='1.0'?>
<locales>
<locale>
<englishName>English (US)</englishName>
<codes>
<code>
<standard>
<name>FB</name>
<representation>en_US</representation>
</standard>
</code>
</codes>
</locale>
</locales>"""


# keep coordinated with participant1_user in fixtures
p1_name = "A. Barking Loon"
p1_email = 'abloon@gmail.com'
p1_uid = '111111111111111111111'

fake_social_token = json.dumps({
    "access_token": "some_token",
    "token_type": "Bearer",
    "expires_in": 3600,
    "id_token": "some_other_token"})

fake_social_profile = json.dumps({
    'access_token': 'some_token',
    'displayName': p1_name,
    'emails': [{'type': 'account', 'value': p1_email}],
    'etag': '"etag"',
    'expires': 3600,
    'expires_in': 3600,
    'id': p1_uid,
    'id_token': 'some_other_token',
    'image': {'isDefault': False,
        'url': 'https://lh4.googleusercontent.com/abcd/photo.jpg?sz=50'},
    'isPlusUser': True,
    'kind': 'plus#person',
    'language': 'en',
    'name': {'familyName': 'Loon', 'givenName': 'A. Barking'},
    'objectType': 'person',
    'verified': False})

fake_responses = {
    "https://accounts.google.com/o/oauth2/token": fake_social_token,
    "https://www.googleapis.com/plus/v1/people/me": fake_social_profile,
    "https://www.facebook.com/translations/FacebookLocales.xml": fake_facebook_locale_info
}


def fake_response_handler(url=None, **kwargs):
    r = Response()
    r.status_code = 200
    r.encoding = "utf-8"
    assert url in fake_responses, "unknown URL: " + url
    r._content = fake_responses[url]
    return r


def test_social_login(
        test_session, test_app, discussion, google_identity_provider, request):
    res = test_app.get("/login/"+google_identity_provider.provider_type)
    assert res.status_code == 302  # Found
    url = urlparse.urlparse(res.location)
    qs = urlparse.parse_qs(url.query)
    state = qs['state']
    code = 'code'
    session_state = 'session_state'
    with mock.patch('requests.sessions.Session.request') as mock_request:
        mock_request.side_effect = fake_response_handler
        res = test_app.get(
            "/complete/"+google_identity_provider.provider_type, {
                'state': state,
                'code': code,
                'authuser': '0',
                'session_state': session_state,
                'prompt': 'none'})
    account = test_session.query(SocialAuthAccount).filter_by(
        email=p1_email).first()
    assert account
    assert account.uid == p1_uid
    assert account.profile.name == p1_name
