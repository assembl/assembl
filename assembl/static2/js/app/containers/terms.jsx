import React from 'react';
import { Translate } from 'react-redux-i18n';

class Terms extends React.Component {
  render() {
    return (
      <p><Translate value="terms.panelTitle" /></p>
    );
  }
}

export default Terms;