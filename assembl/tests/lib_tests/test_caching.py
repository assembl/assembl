import pytest
import mock

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