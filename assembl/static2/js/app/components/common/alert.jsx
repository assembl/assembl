import React from 'react';
import { Alert } from 'react-bootstrap';

class AssemblAlert extends React.Component {
  render() {
    const { showAlert, style, msg, isBase } = this.props;
    if (isBase) { return (<Alert className='hideAlert' /> ); }
    else { return (<Alert className={showAlert ? 'showAlert' : 'hideAlert'} bsStyle={style}>{msg}</Alert> ); }
  }
}

export default AssemblAlert;