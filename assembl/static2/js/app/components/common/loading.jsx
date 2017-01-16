import React from 'react';
import { Translate } from 'react-redux-i18n';

class Loading extends React.Component {
  render() {
    return (
      <p><Translate value="loading.wait" /></p>
    );
  }
}

export default Loading;