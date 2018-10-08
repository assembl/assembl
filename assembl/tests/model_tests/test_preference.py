import pytest
from simplejson import JSONDecodeError

def test_preference_address_empty(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = ""
        assert False, "An error should have been raised"
    except:
        assert True


def test_preference_address_bad_url(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "myurl.itsbad/what_are_you_doing?"
        assert False, "An error should have been raised"
    except:
        assert True


def test_preference_address_bad_ipv4_1(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "http://12.12.123."
        assert False, "An error should have been raised"
    except:
        assert True


def test_preference_address_bad_ipv4_2(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "https://12.12.123.123.0"
        assert False, "An error should have been raised"
    except:
        assert True


def test_preference_address_bad_ipv4_3(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "https://12.12"
        assert False, "An error should have been raised"
    except:
        assert True


def test_preference_address_bad_ipv6_1(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "https://FE80:0000:0000:0000:0202:B3FF:FE1E"
        assert False, "An error should have been raised"
    except:
        assert True


def test_preference_address_bad_ipv6_2(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "https://FE80:0000:0000:0000:0202:B3FF:FE1E:8329::"
        assert False, "An error should have been raised"
    except:
        assert True


def test_preference_address_bad_ipv6_3(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "https://HELLO:0000:0000:0000:HOWE:AREE:YOUU:8329"
        assert False, "An error should have been raised"
    except:
        assert True


def test_preference_address_bad_garbage(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "This should fail pretty terribly!"
        assert False, "An error should have been raised"
    except:
        assert True


def test_preference_address_good_url(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "https://www.google.com"
        assert True
    except:
        assert False, "An error should NOT have been raised"


def test_preference_address_good_url_with_port(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "http://localhost:9000"
        assert True
    except:
        assert False, "An error should NOT have been raised"


def test_preference_address_good_ipv4(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "http://127.0.0.1"
        assert True
    except:
        assert False, "An error should NOT have been raised"


def test_preference_address_good_ipv6(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "http://FE80:0000:0000:0000:0202:B3FF:FE1E:8329"
        assert True
    except:
        assert False, "An error should NOT have been raised"


def test_preference_address_good_special_character(test_session, non_standard_preference):
    try:
        key = 'test_url'
        non_standard_preference[key] = "*"
        assert True
    except:
        assert False, "An error should NOT have been raised"


def test_preferences_extra_json_valid_json(test_session, discussion):
    preferences = discussion.preferences
    valid_json = '{"hello": "world"}'
    preferences['extra_json'] = valid_json


def test_preferences_extra_json_invalid_json(test_session, discussion):
    preferences = discussion.preferences
    invalid_json = '{"hello: "world"}'
    with pytest.raises(JSONDecodeError):
        preferences['extra_json'] = invalid_json
