// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import classnames from 'classnames';
import { getCookieItem, setCookieItem, getDiscussionSlug } from '../utils/globalFunctions';
import { get } from '../utils/routeMap';
import updateAcceptedCookies from '../graphql/mutations/updateAcceptedCookies.graphql';
import acceptedCookiesQuery from '../graphql/acceptedCookiesQuery.graphql';
import { COOKIE_TYPES } from '../constants';
import manageErrorAndLoading from './common/manageErrorAndLoading';

type State = {
  hide: ?boolean
};

type Props = {
  cookiesList: Array<string>,
  updateAcceptedCookies: Function
};

export class DumbCookiesBar extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { cookiesList } = props;
    const cookiesFromBrowser = getCookieItem('cookies_configuration');
    const shouldHideBar =
      cookiesList && cookiesList.length > 0
        ? // cookiesList comes from the query and is only received if the user is logged in
        COOKIE_TYPES.some(cookie => cookiesList.includes(cookie))
        : // if the user is not logged in, we check in the browser instead of the backend
        COOKIE_TYPES.some(cookie => cookiesFromBrowser && cookiesFromBrowser.split(',').includes(cookie));
    this.state = { hide: shouldHideBar };
  }

  acceptAllCookies = () => {
    const acceptCookiesTypes = COOKIE_TYPES.filter(cookie => cookie.includes('ACCEPT'));
    // acceptedCookies are stored both on the user model and in the browser
    this.props.updateAcceptedCookies({ variables: { actions: acceptCookiesTypes } });
    setCookieItem('cookies_configuration', acceptCookiesTypes);
    this.setState({
      hide: true
    });
  };

  render() {
    const { hide } = this.state;
    const cookiesBarClassnames = classnames('cookies-bar-wrapper', { 'show-cookies-bar': !hide, 'hide-cookies-bar': hide });
    const slug = getDiscussionSlug();
    return (
      <div className={cookiesBarClassnames}>
        <div className="cookies-bar">
          <Translate value="cookiesBar.cookiesNotice" className="cookies-text" />
          <div className="cookies-buttons-container">
            <Button onClick={this.acceptAllCookies} className="button-submit button-dark cookies-button">
              <Translate value="cookiesBar.accept" />
            </Button>
            <Link to={get('cookiesPolicy', { slug: slug })}>
              <Button
                className="button-submit button-dark cookies-button"
                onClick={() => {
                  this.setState({ hide: true });
                }}
              >
                <Translate value="cookiesBar.seeCookiesPolicy" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
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
    skip: props => !props.id,
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        cookiesList: data.user.acceptedCookies
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: false })
)(DumbCookiesBar);