import React from 'react';
import { Translate } from 'react-redux-i18n';

class NotFound extends React.Component {
  render() {
    return (
      <p><Translate value="notFound.panelTitle" /></p>
    );
  }
}

export default NotFound;