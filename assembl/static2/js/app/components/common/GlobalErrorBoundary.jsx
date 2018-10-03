// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = {
  children: React.Node
};

type State = {
  error: ?Error
};

export default class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ error: error });
    // TODO: log the error to sentry
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