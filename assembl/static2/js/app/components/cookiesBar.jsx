// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import classnames from 'classnames';
import { getCookieItem, setCookieItem, getDiscussionSlug } from '../utils/globalFunctions';
import { get } from '../utils/routeMap';

type State = {
  hide: boolean
};

type Props = {};

class CookiesBar extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hide: getCookieItem('_ACCEPTED_COOKIES_') === 'true' };
  }

  acceptCookies = () => {
    setCookieItem('_ACCEPTED_COOKIES_', true);
    this.setState({ hide: true });
    // The local state is updated here to avoid having to refresh to hide the bar
  }

  render() {
    const { hide } = this.state;
    const cookiesBarClassnames = classnames('cookies-bar', { 'show-cookies-bar': !hide, 'hide-cookies-bar': hide });
    const slug = getDiscussionSlug();
    return (
      <div
        className={cookiesBarClassnames}
      >
        <Translate value="cookiesBar.cookiesNotice" className="cookies-text" />
        <div className="cookies-buttons-container">
          <Button onClick={this.acceptCookies} className="button-submit button-dark cookies-button" >
            <Translate value="cookiesBar.accept" />
          </Button>
          <Link to={get('cookiesPolicy', { slug: slug })}>
            <Button className="button-submit button-dark cookies-button">
              <Translate value="cookiesBar.seeCookiesPolicy" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }
}

export default CookiesBar;