import React from 'react';
import { Translate } from 'react-redux-i18n';

class Error extends React.Component {
  render() {
    return (
      <p><Translate value="error.reason" /></p>
    );
  }
}

export default Error;