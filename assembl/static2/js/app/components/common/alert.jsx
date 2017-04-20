import React from 'react';
import { Alert } from 'react-bootstrap';

class AssemblAlert extends React.Component {
  render() {
    const { showAlert, style, msg } = this.props;
    return (
      <Alert className={showAlert ? 'showAlert' : 'hideAlert'} bsStyle={style}>{msg}</Alert>
    );
  }
}

export default AssemblAlert;