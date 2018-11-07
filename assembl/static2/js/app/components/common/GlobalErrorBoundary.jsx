// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';

// eslint-disable-next-line import/no-extraneous-dependencies
import * as Sentry from '@sentry/browser';

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
        <div>
          <h1>
            <Translate value="globalError" />
          </h1>
        </div>
      );
    }

    return this.props.children;
  }
}