import React from 'react';
import { Alert } from 'react-bootstrap';

class AssemblAlert extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      base: true
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isBase) {
      this.setState({
        base: true
      });
    }
  }

  render() {
    const { showAlert, alertStyle, alertMsg, topPosition } = this.state;
    if (this.state.base) {
      return (<Alert className="hideAlert" />);
    }
    return (
      <Alert
        style={topPosition ? { top: 0 } : { margin: 0 }}
        className={showAlert ? 'showAlert' : 'hideAlert'}
        bsStyle={alertStyle}
      >
        {alertMsg}
      </Alert>
    );
  }
}

export default AssemblAlert;