// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';
import classnames from 'classnames';
import CookieToggle from './cookieToggle';
import type { CookieObject } from './cookieToggle';

type CookiesSelectorProps = {};

type CookiesSelectorState = {
  activeKey: ?string,
  show: boolean,
  cookies: Array<CookieObject>
}


class CookiesSelector extends React.Component<CookiesSelectorProps, CookiesSelectorState> {
  constructor(props: CookiesSelectorProps) {
    super(props);
    const cookiesList = document.cookie.split(' ');
    const cookies = [];
    cookiesList
      .map(cookie => ({ ...this.getCookieObject(cookie), accepted: true }))
      .forEach(cookieObject => cookies.push(cookieObject));
    this.state = {
      activeKey: 'essential',
      show: true,
      cookies: cookies
    };
  }

  getCookieObject = (cookie: string) => {
    if (cookie.includes('assembl_session' || 'LOCALE')) {
      return { category: 'essential', name: 'userSession' };
    }
    if (cookie.includes('_pk_')) {
      return { category: 'analytics', name: 'piwik' };
    }
    return { category: 'other', name: cookie };
  };

  handleToggle = (updatedCookie: CookieObject) => {
    const { cookies } = this.state;
    const filteredCookies = cookies.filter(c => c.name !== updatedCookie.name);
    filteredCookies.push(updatedCookie);
    this.setState({ cookies: filteredCookies });
  }

  saveChanges = () => {
    // saves the new cookies settings stored in localstate in the backend
  }

  render() {
    const { activeKey, show, cookies } = this.state;
    return (
      <div className="cookies-selector page-body">
        {cookies.map(cookie => cookie.category).map((category) => {
          const isActiveKey = category === activeKey;
          return (
            <div key={`category-${category}`}>
              <div
                className="cookies-category-selector"
                onClick={() => {
                  this.setState({ activeKey: category, show: !show });
                  return category !== activeKey && this.setState({ show: true });
                }}
              >
                <span className={classnames('assembl-icon-right-dir', { 'active-arrow': isActiveKey })} />
                <Translate value={`cookiesPolicy.${category}`} className="dark-title-4" />
              </div>
              <div className="cookies-toggles">
                {isActiveKey && show &&
                cookies.filter(cookie => cookie.category === category).map(cookie => (
                  <CookieToggle
                    cookie={cookie}
                    key={cookie.name}
                    handleToggle={this.handleToggle}
                  />
                ))
                }
              </div>
            </div>
          );
        })}
        <Button onClick={this.saveChanges} className="button-submit button-dark">
          <Translate value="profile.save" />
        </Button>
      </div>);
  }
}

export default CookiesSelector;