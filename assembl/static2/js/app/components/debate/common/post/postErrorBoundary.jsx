// @flow
import * as React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import * as Sentry from '@sentry/browser';

type Props = {
  children: React.Node
};

type State = {
  error: ?Error
};

export default class PostErrorBoundary extends React.Component<Props, State> {
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
        <div className="posts">
          <div className="box">
            <Row className="post-row">
              <Col xs={12} md={12} className="post-left">
                <div className="body">
                  <Translate value="postLoadError" />
                </div>
              </Col>
            </Row>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = (WrappedComponent: React.ComponentType<mixed>) => (wrappedProps: mixed) => (
  <PostErrorBoundary>
    <WrappedComponent {...wrappedProps} />
  </PostErrorBoundary>
);