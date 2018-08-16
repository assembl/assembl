// @flow
// eslint-disable
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';
import classnames from 'classnames';
import CookieToggle from './cookieToggle';
import type { CookieObject } from './cookieToggle';
import acceptedCookiesQuery from '../../graphql/acceptedCookiesQuery.graphql';
import updateAcceptedCookies from '../../graphql/mutations/updateAcceptedCookies.graphql';
import withLoadingIndicator from '../common/withLoadingIndicator';
import { getCookieItem, setCookieItem } from '../../utils/globalFunctions';

type CookiesSelectorProps = {};

type CookiesSelectorState = {
  activeKey: ?string,
  show: boolean,
  cookies: Object
};


export class DumbCookiesSelector extends React.Component<CookiesSelectorProps, CookiesSelectorState> {
  constructor(props: CookiesSelectorProps) {
    super(props);
    const cookiesList = props.cookiesList ? props.cookiesList : getCookieItem('cookies_configuration').split(',');
    const cookiesArray = cookiesList.map(
      cookie => ({ ...this.getCookieObject(cookie), accepted: this.isCookieAccepted(cookie), realName: cookie })
    );
    const cookiesByCategory = this.getCookiesObjectFromArray(cookiesArray);
    this.state = {
      activeKey: 'essential',
      show: true,
      cookies: cookiesByCategory
    };
  }

  isCookieAccepted = (cookie) => {
    if (cookie.startsWith('ACCEPT')) {
      return true;
    }
    return false;
  }

  getCookieObject = (cookie: string) => {
    if (cookie.startsWith('assembl_session') || cookie.includes('SESSION_ON_DISCUSSION')) {
      return { category: 'other', name: 'userSession', hasChanged: false };
    }
    if (cookie.startsWith('_LOCALE_') || cookie.includes('LOCALE_ON_DISCUSSION')) {
      return { category: 'essential', name: 'locale', hasChanged: false };
    }
    if (cookie.startsWith('_pk_') || cookie.includes('TRACKING_ON_DISCUSSION')) {
      return { category: 'analytics', name: 'piwik', hasChanged: false };
    }
    return { category: 'other', name: cookie, hasChanged: false };
  };

  getCookiesObjectFromArray = (cookiesArray: Array<CookieObject>) => {
    const cookiesObject = {};
    cookiesArray.forEach(function(cookie) { // eslint-disable-line
      const { category } = cookie;
      if (cookiesObject[category]) {
        cookiesObject[category] = [...cookiesObject[category], cookie];
      } else {
        cookiesObject[category] = [cookie];
      }
    });
    return cookiesObject;
  }

  handleToggle = (updatedCookie: CookieObject) => {
    const { cookies } = this.state;
    const cookiesArray = Object.values(cookies).reduce((flat, next) => flat.concat(next), []);
    const updatedCookiesArray = cookiesArray.map(
      (cookie: CookieObject) => (cookie.name === updatedCookie.name ? { ...updatedCookie, hasChanged: true } : cookie));
    const updatedCookiesByCategory = this.getCookiesObjectFromArray(updatedCookiesArray);
    this.setState({ cookies: updatedCookiesByCategory });
  }

  toggleCookieString = (cookie: string) =>
    (cookie.startsWith('ACCEPT') ? cookie.replace('ACCEPT', 'REJECT') : cookie.replace('REJECT', 'ACCEPT'));

  saveChanges = () => {
    const { cookies } = this.state;
    const cookiesArray = Object.values(cookies).reduce((flat, next) => flat.concat(next), []);
    const changedCookies = cookiesArray.filter(cookie => cookie.hasChanged);
    const changedCookiesNewNames = changedCookies.map(cookie => this.toggleCookieString(cookie.realName));
    const newCookiesList = cookiesArray.filter(cookie => !cookie.hasChanged).map(cookie => cookie.realName);
    changedCookiesNewNames.forEach((cookie) => { newCookiesList.push(cookie); });
    // Update the cookies in the back
    this.props.updateAcceptedCookies({ variables: { actions: newCookiesList } });
    // Update the cookies in the browser
    setCookieItem('cookies_configuration', newCookiesList);
  }

  render() {
    const { activeKey, show, cookies } = this.state;
    return (
      <React.Fragment>
        <div className="cookies-selector">
          <h2 className="dark-title-2">
            <Translate value="profile.cookies" />
          </h2>
          <Translate value="cookiesPolicy.instructions" className="cookies-instructions" />
          <div className="cookies-categories">
            {Object.keys(cookies).map((category) => {
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
                    <Translate value={`cookiesPolicy.${category}`} className="dark-title-3" />
                  </div>
                  <div className="cookies-toggles">
                    {isActiveKey && show &&
              cookies[category].map((cookie, index) => (
                <CookieToggle
                  cookie={cookie}
                  key={`${cookie.name}-${index}`}
                  handleToggle={this.handleToggle}
                />
              ))}
                  </div>
                </div>
              );
            }) }
          </div>
          <div className="submit-button-container">
            <Button onClick={this.saveChanges} className="button-submit button-dark">
              <Translate value="profile.save" />
            </Button>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({ context }) => ({
  id: context.connectedUserIdBase64
});

export default compose(connect(mapStateToProps),
  graphql(updateAcceptedCookies, {
    name: 'updateAcceptedCookies'
  }),
  graphql(acceptedCookiesQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return { loading: true };
      }
      if (data.error) {
        return { error: data.error };
      }
      return {
        cookiesList: data.user.acceptedCookies
      };
    }
  }), withLoadingIndicator())(DumbCookiesSelector);