import pytest
import mock
from assembl.models import Discussion

from assembl.lib.caching import create_analytics_region


def test_dogpile_cache():
    visit_analytics_region = create_analytics_region()
    # mock object
    mock_o = mock.MagicMock(return_value=1)
    # wrap in function, because dogpile really wants functions
    mock_f = lambda x: mock_o(x)
    # wrap in dogpile
    dogMock = visit_analytics_region.cache_on_arguments(expiration_time=10)(mock_f)
    # invalidate from previous tests
    dogMock.invalidate(1)
    # call twice
    dogMock(1)
    dogMock(1)
    # underlying mock should be called once
    assert mock_o.call_count == 1


def test_cache_key(test_session):
    d = Discussion(
        topic=u"John Doe", slug="johndoe",
        subscribe_to_notifications_on_signup=False,
        creator=None,
        session=test_session)
    fn = test_cache_key
    result = d.generate_redis_key(fn)
    expected_result = "test_cache_key_" + str(d.id) + "_21_42"
    assert result(d, 21, 42) == expected_result
    test_session.delete(d.table_of_contents)
    test_session.delete(d.root_idea)
    test_session.delete(d.next_synthesis)
    preferences = d.preferences
    d.preferences = None
    d.preferences_id = None
    for ut in d.user_templates:
        for ns in ut.notification_subscriptions:
            ns.delete()
        ut.delete()
    test_session.delete(preferences)
    test_session.delete(d)
    test_session.flush()
