// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import * as Sentry from '@sentry/browser';

import { get } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';

type Props = {
  children: React.Node
};

type State = {
  error: ?Error
};

export default class GlobalErrorBoundary extends React.Component<Props, State> {
  state = { error: null };

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ error: error });
    Sentry.withScope((scope) => {
      Object.keys(info).forEach((key) => {
        scope.setExtra(key, info[key]);
      });
      Sentry.captureException(error);
    });

    if (process.env.NODE_ENV === 'development') {
      console.error(error, info.componentStack); // eslint-disable-line no-console
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="globalError">
          <h1>
            <Translate value="globalError" />
          </h1>
          <Link className="button-link button-dark margin-l" href={`${get('home', { slug: getDiscussionSlug() })}`}>
            <Translate value="unauthorizedAdministration.returnButton" />
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}