from splinter import browser

def test_some_browser_stuff(browser, test_server):
    """Test using real browser."""
    print test_server.url
    browser.visit(test_server.url)
    print browser.html
    assert browser.is_text_present('Assembl')
