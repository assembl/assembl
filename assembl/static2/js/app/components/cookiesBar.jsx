// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { compose, graphql, withApollo, type ApolloClient } from 'react-apollo';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import classnames from 'classnames';
import { getCookieItem, setCookieItem, getDiscussionSlug, getDiscussionId } from '../utils/globalFunctions';
import { get } from '../utils/routeMap';
import updateAcceptedCookies from '../graphql/mutations/updateAcceptedCookies.graphql';
import acceptedCookiesQuery from '../graphql/acceptedCookiesQuery.graphql';
import { COOKIE_TYPES } from '../constants';

type State = {
  hide: ?boolean
};

type Props = {
  client: ApolloClient,
  acceptedCookies: Array<string>
};

const discussionId = getDiscussionId();

const formattedCookieNames = COOKIE_TYPES.map(cookie => discussionId && `${cookie}_${discussionId}`);

export const saveAcceptedCookies = (cookies: Array<string>, client: ApolloClient) => {
  client.mutate({
    mutation: updateAcceptedCookies,
    variables: {
      actions: cookies
    }
  })
  // If the user is not logged in the mutation will error
    .catch(() => { formattedCookieNames.forEach(cookie => cookie && setCookieItem(cookie, 'true')); });
};

export class DumbCookiesBar extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hide: true };
  }

  componentWillReceiveProps({ acceptedCookies }: Props) {
    if (acceptedCookies) {
      // acceptedCookies from the query is only received if the user is logged in
      const userHasConfiguredCookies = COOKIE_TYPES.some(cookie => acceptedCookies.includes(cookie));
      this.setState({ hide: userHasConfiguredCookies });
    } else {
      // is the user is not logged in, we check in the browser instead of the backend
      const hasConfiguredCookies = formattedCookieNames.some(cookie => cookie && getCookieItem(cookie) === 'true');
      this.setState({ hide: hasConfiguredCookies });
    }
  }

  acceptAllCookies = () => {
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
        return { laoding: true };
      }
      if (data.error) {
        return { error: data.error };
      }
      return {
        acceptedCookies: data.user.acceptedCookies
      };
    }
  }),
  withApollo)(DumbCookiesBar);