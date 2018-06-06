// @flow
import * as React from 'react';
import { Localize } from 'react-redux-i18n';

type Props = {
  value: number | string
};

type State = {
  hasError: boolean
};

// see doc https://reactjs.org/docs/error-boundaries.html

// catch issue in Intl lib with 'no' locale when localizing a number
// Uncaught ReferenceError: No locale data has been provided for this object yet.
//    at ResolveLocale (core.js:1428)
//    at InitializeNumberFormat (core.js:1918)

export default class LocalizeNumber extends React.Component<Props, State> {
  state = { hasError: false };

  componentDidCatch() {
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return this.props.value;
    }
    return <Localize {...this.props} />;
  }
}