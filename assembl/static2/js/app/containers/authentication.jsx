import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';

class Authentication extends React.Component {
  render() {
    return (
      <p><Translate value="authentication.panelTitle" /></p>
    );
  }
}

export default Authentication;