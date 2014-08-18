from splinter import browser

from jasmine_runner.commands import run_specs_with_browser

def test_some_browser_stuff(browser, test_server):
    """Test using real browser."""
    browser.visit(test_server.url)
    assert browser.title == 'Assembl'


def test_jasmine(browser, test_server, discussion, test_session):
    """Test using real browser."""
    url = "%s/%s/test" % (test_server.url, discussion.slug)
    test_session.commit()
    num_failures = run_specs_with_browser(url, browser)
    assert not num_failures
