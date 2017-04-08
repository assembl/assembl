import pytest
from time import sleep
from flaky import flaky


def test_front_page(browser, test_server, db_default_data):
    """Test using real browser."""
    browser.visit(test_server.url)
    assert browser.title == 'Assembl'


def test_mocha(browser, test_server, discussion, test_session,
               test_webrequest, json_representation_of_fixtures):
    """Test using real browser."""
    from jasmine_runner.commands import run_extractor_with_browser
    url = "%s/%s/test" % (test_server.url, discussion.slug)
    test_session.commit()
    extractor = run_extractor_with_browser(url, browser, False)
    # print extractor.get_failures()
    # print browser.driver.get_log('browser')
    assert not extractor.failures_number


@pytest.mark.xfail
def test_private_discussion_log_in_form_exists_and_works(test_server_no_login_real_policy, browser, test_session, discussion, participant1_user, test_webrequest):
    url = test_server_no_login_real_policy.url + test_webrequest.route_path(
        'home', discussion_slug=discussion.slug)
    test_session.commit()
    browser.visit(url)

    # This discussion is private, so it should redirect me to the discussion-local login page
    assert browser.status_code.is_success()
    assert "/login" in browser.url

    # Make sure the login form is present in the page, with its fields
    login_form_selector = '.signinWrapper form'
    input_login_selector = '.signinWrapper form input[name=identifier]'
    input_password_selector = '.signinWrapper form input[name=password]'
    submit_selector = '.signinWrapper form .js_login'
    assert browser.is_element_present_by_css(login_form_selector)
    assert browser.is_element_present_by_css(input_login_selector)
    assert browser.is_element_present_by_css(input_password_selector)
    assert browser.is_element_present_by_css(submit_selector)

    # Try to log in using an existing user
    browser.find_by_css(input_login_selector).fill(participant1_user.get_preferred_email())
    browser.find_by_css(input_password_selector).fill('password')
    browser.find_by_css(submit_selector).first.click()

    # Submitting the login form should log me in, so I should not be on the login page anymore
    assert "/login" not in browser.url
    # The login failed, to be investigated. I get a 401 or another 307.
    assert browser.status_code.code == 200

    # But in this case, the backend logs me in but says I'm not allowed to see this discussion. Why? Fixing this will correspond to another test!
    path = test_webrequest.route_path(
        'contextual_logout', discussion_slug=discussion.slug)
    assert browser.find_link_by_href(path)  # Even the forbidden page contains a logout link
    # user_dropdown_selector = '.navbar-right .dropdown-toggle.username'
    # assert browser.is_element_present_by_css(user_dropdown_selector)


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
    sleep(0.1)  # the button is not immediately visible
    all_messages_button.click()
    assert browser.is_element_present_by_css('.message', wait_time=10)
    assert 20 == len(browser.find_by_css('.message'))
