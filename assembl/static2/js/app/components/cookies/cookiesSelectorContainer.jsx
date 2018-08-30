// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import CookiesSelector from './cookiesSelector';
import { getCookieItem, setCookieItem } from '../../utils/globalFunctions';
import { displayAlert } from '../../utils/utilityManager';

// graphql
import acceptedCookiesQuery from '../../graphql/acceptedCookiesQuery.graphql';
import updateAcceptedCookies from '../../graphql/mutations/updateAcceptedCookies.graphql';
import withLoadingIndicator from '../common/withLoadingIndicator';

import type { CookieObject } from './cookieToggle';
import { COOKIE_TRANSLATION_KEYS, COOKIE_TYPES } from '../../constants';

type Props = {
  updateAcceptedCookies: Function,
  cookiesList: Array<string>
};

export type CookiesObject = {
  other?: Array<CookieObject>,
  essential?: Array<CookieObject>,
  analytics?: Array<CookieObject>
};

type State = {
  activeKey: ?string,
  show: boolean,
  cookies: ?CookiesObject
};

export class DumbCookiesSelectorContainer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // @$FlowFixMe flow does not see that getCookieItem has been checked as non null
    const cookiesFromBrowser = getCookieItem('cookies_configuration') && getCookieItem('cookies_configuration').split(',');
    const initialCookiesList = COOKIE_TYPES.filter(cookie => cookie.includes('ACCEPT'));
    const cookiesList = props.cookiesList && props.cookiesList.length > 0
      ? // if the user is logged in, we get the cookiesList from the query
      props.cookiesList
      : // otherwise, we take it from the browser
      cookiesFromBrowser ||
      // if browser cookies are empty aswell, we take the initial configuration list
      initialCookiesList;
    const cookiesArray =
      cookiesList &&
      cookiesList.map(cookie => ({
        ...this.getCookieObjectData(cookie),
        accepted: this.isCookieAccepted(cookie),
        cookieType: cookie
      }));
    const cookiesByCategory = cookiesArray && this.getCookiesObjectFromArray(cookiesArray);

    this.state = {
      activeKey: 'essential',
      show: true,
      cookies: cookiesByCategory
    };
  }

  isCookieAccepted = (cookie: string): boolean => {
    if (cookie.startsWith('ACCEPT')) {
      return true;
    }
    return false;
  };

  getCookieObjectData = (cookie: string) => {
    if (cookie.includes('SESSION_ON_DISCUSSION')) {
      return { category: 'essential', name: COOKIE_TRANSLATION_KEYS.userSession };
    }
    if (cookie.includes('LOCALE')) {
      return { category: 'essential', name: COOKIE_TRANSLATION_KEYS.locale };
    }
    if (cookie.includes('TRACKING_ON_DISCUSSION')) {
      return { category: 'analytics', name: COOKIE_TRANSLATION_KEYS.piwik };
    }
    if (cookie.includes('PRIVACY_POLICY_ON_DISCUSSION')) {
      return { category: 'essential', name: COOKIE_TRANSLATION_KEYS.privacyPolicy };
    }
    if (cookie.includes('CGU')) {
      return { category: 'essential', name: COOKIE_TRANSLATION_KEYS.cgu };
    }
    return { category: 'other', name: cookie };
  };

  getCookiesObjectFromArray = (cookiesArray: Array<CookieObject>) => {
    const cookiesObject = {};
    cookiesArray.forEach((cookie) => {
      // eslint-disable-line
      const { category } = cookie;
      if (cookiesObject[category]) {
        cookiesObject[category] = [...cookiesObject[category], cookie];
      } else {
        cookiesObject[category] = [cookie];
      }
    });
    return cookiesObject;
  };

  handleToggle = (updatedCookie: CookieObject) => {
    const { cookies } = this.state;
    // Flow bugs with Object.values
    // see https://github.com/facebook/flow/issues/2221
    // $FlowFixMe
    const cookiesArray: Array<CookieObject> =
      cookies &&
      Object.keys(cookies)
        .map(cookie => cookies[cookie])
        .reduce((flat, next) => flat.concat(next), []);
    const updatedCookiesArray = cookiesArray.map(
      (cookie: CookieObject) =>
        (cookie.name === updatedCookie.name ? { ...updatedCookie, cookieType: this.toggleCookieType(cookie.cookieType) } : cookie)
    );
    const updatedCookiesByCategory = this.getCookiesObjectFromArray(updatedCookiesArray);
    this.setState({ cookies: updatedCookiesByCategory });
  };

  toggleCookieType = (cookie: string): string =>
    (cookie.startsWith('ACCEPT') ? cookie.replace('ACCEPT', 'REJECT') : cookie.replace('REJECT', 'ACCEPT'));

  saveChanges = () => {
    const { cookies } = this.state;
    // Flow bugs with Object.values
    // see https://github.com/facebook/flow/issues/2221
    // $FlowFixMe
    const cookiesArray: Array<CookieObject> =
      cookies &&
      Object.keys(cookies)
        .map(cookie => cookies[cookie])
        .reduce((flat, next) => flat.concat(next), []);
    const newCookiesList = cookiesArray.map(c => c.cookieType);
    // Update the cookies in the back
    this.props.updateAcceptedCookies({ variables: { actions: newCookiesList } });
    // Update the cookies in the browser
    setCookieItem('cookies_configuration', newCookiesList);
    displayAlert('success', I18n.t('cookiesPolicy.success'));
  };

  handleCategorySelection = (category: string) => {
    const { show, activeKey } = this.state;
    this.setState({ activeKey: category, show: !show });
    return category !== activeKey && this.setState({ show: true });
  };

  render() {
    const { cookies, show, activeKey } = this.state;
    return (
      <CookiesSelector
        cookies={cookies}
        show={show}
        activeKey={activeKey}
        handleSave={this.saveChanges}
        handleToggle={this.handleToggle}
        handleCategorySelection={this.handleCategorySelection}
        toggleCookieType={this.toggleCookieType}
      />
    );
  }
}

const mapStateToProps = ({ context }) => ({
  id: context.connectedUserIdBase64
});

export default compose(
  connect(mapStateToProps),
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
  }),
  withLoadingIndicator()
)(DumbCookiesSelectorContainer);