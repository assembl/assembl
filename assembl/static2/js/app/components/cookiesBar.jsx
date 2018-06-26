// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import { getCookieItem, setCookieItem, getDiscussionSlug } from '../utils/globalFunctions';
import { get } from '../utils/routeMap';

type State = {
  hide: ?boolean | string
};

class CookiesBar extends React.Component<*, State> {
  constructor(props: *) {
    super(props);
    this.state = { hide: getCookieItem('_ACCEPTED_COOKIES_') };
  }

  acceptCookies = () => {
    setCookieItem('_ACCEPTED_COOKIES_', true); this.setState({ hide: true });
  }

  render() {
    const { hide } = this.state;
    const slug = getDiscussionSlug();
    return (
      <div
        className={hide ? 'hidden' : 'cookies-bar'}
      >
        <Translate value="cookiesBar.cookiesNotice" className="cookies-text" />
        <Button onClick={this.acceptCookies} className="button-submit button-dark" key="accept-cookies">
          <Translate value="cookiesBar.accept" />
        </Button>
        <Link to={get('cookiesPolicy', { slug: slug })}>
          <Button key="see-cookies-policy" className="button-cancel button-dark">
            <Translate value="cookiesBar.seeCookiesPolicy" />
          </Button>
        </Link>
      </div>
    );
  }
}

export default CookiesBar;