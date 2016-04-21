import pytest
from flaky import flaky

def test_front_page(browser, test_server, db_default_data):
    """Test using real browser."""
    browser.visit(test_server.url)
    assert browser.title == 'Assembl'


def test_mocha(browser, test_server, discussion, test_session, test_webrequest):
    """Test using real browser."""
    from jasmine_runner.commands import run_specs_with_browser
    url = "%s/%s/test" % (test_server.url, discussion.slug)
    test_session.commit()
    num_failures = run_specs_with_browser(url, browser, False)
    assert not num_failures


@flaky(max_runs=3)
def test_load_messages(
        browser, test_server, test_session, discussion,
        jack_layton_mailbox, test_webrequest):
    """Test using real browser."""
    url = "%s/%s/" % (test_server.url, discussion.slug)
    test_session.commit()
    browser.visit(url)
    assert browser.is_element_present_by_css('.js_navigation', wait_time=120)
    accordeon_buttons = browser.find_by_css('.js_navigation')
    accordeon_buttons = {b['data-view']: b for b in accordeon_buttons}
    button = accordeon_buttons[u'debate']
    if not button.has_class('active'):
        button.click()
    assert browser.is_element_present_by_css('.allMessagesView .idealist-title', wait_time=10)
    all_messages_button = browser.find_by_css('.allMessagesView .idealist-title')
    all_messages_button.click()
    assert browser.is_element_present_by_css('.message', wait_time=10)
    assert 20 == len(browser.find_by_css('.message'))
