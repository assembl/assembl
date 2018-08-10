// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import classnames from 'classnames';
import { getCookieItem, setCookieItem, getDiscussionSlug, getDiscussionId } from '../utils/globalFunctions';
import { get } from '../utils/routeMap';
import updateAcceptedCookies from '../graphql/mutations/updateAcceptedCookies.graphql';
import acceptedCookiesQuery from '../graphql/acceptedCookiesQuery.graphql';
import { COOKIE_TYPES } from '../constants';
import withoutLoadingIndicator from './common/withoutLoadingIndicator';

type State = {
  hide: ?boolean
};

type Props = {
  acceptedCookies: Array<string>,
  updateAcceptedCookies: Function
};

const discussionId = getDiscussionId();

const formattedCookieNames = COOKIE_TYPES.map(cookie => discussionId && `${cookie}_${discussionId}`);


export class DumbCookiesBar extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { acceptedCookies } = props;
    const shouldHideBar = acceptedCookies ?
      // acceptedCookies comes from the query and is only received if the user is logged in
      COOKIE_TYPES.some(cookie => acceptedCookies.includes(cookie)) :
      // if the user is not logged in, we check in the browser instead of the backend
      formattedCookieNames.some(cookie => cookie && getCookieItem(cookie) === 'true');
    this.state = { hide: shouldHideBar };
  }

  acceptAllCookies = () => {
    // acceptedCookies are stored both on the user model and in the browser
    this.props.updateAcceptedCookies({ variables: { actions: COOKIE_TYPES } });
    formattedCookieNames.forEach(cookie => cookie && setCookieItem(cookie, 'true'));
    this.setState({
      hide: true
    });
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
          <Button onClick={this.acceptAllCookies} className="button-submit button-dark cookies-button" >
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
        acceptedCookies: data.user.acceptedCookies
      };
    }
  }),
  withoutLoadingIndicator())(DumbCookiesBar);