// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { compose, graphql, withApollo, type ApolloClient } from 'react-apollo';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import classnames from 'classnames';
import { getCookieItem, setCookieItem, getDiscussionSlug, getDiscussionId } from '../utils/globalFunctions';
import { get } from '../utils/routeMap';
import updateAcceptedCookies from '../graphql/mutations/updateAcceptedCookies.graphql';
import { COOKIE_TYPES } from '../constants';

type State = {
  hide: ?boolean
};

type Props = {
  client: ApolloClient
};

const discussionId = getDiscussionId();

export const saveAcceptedCookies = (cookies: Array<string>, client: ApolloClient) => {
  cookies.forEach((cookie) => {
    client.mutate({
      mutation: updateAcceptedCookies,
      variables: {
        action: cookie
      }
    });
  });
};

const formattedCookieNames = COOKIE_TYPES.map(cookie => discussionId && `${cookie}_${discussionId}`);

export class DumbCookiesBar extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const hasAcceptedEveryCookies = formattedCookieNames.every(cookie => cookie && getCookieItem(cookie) === 'true');
    this.state = { hide: hasAcceptedEveryCookies };
  }

  acceptAllCookies = () => {
    formattedCookieNames.forEach(cookie => cookie && setCookieItem(cookie, 'true'));

    const { client } = this.props;
    saveAcceptedCookies(COOKIE_TYPES, client);
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

export default compose(graphql(updateAcceptedCookies, {
  name: 'updateAcceptedCookies'
}), withApollo)(DumbCookiesBar);