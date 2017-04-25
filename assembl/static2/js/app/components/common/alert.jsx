import React from 'react';
import { Alert } from 'react-bootstrap';

class AssemblAlert extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      base: true
    }
  }

  componentDidMount(){
    console.log('didMount', this.props);
    if (this.props.isBase === true) { this.setState({base: true}); }
  }

  componentWillReceiveProps(nextProps) {
    console.log('willRecieveProps', nextProps);
    if (nextProps.isBase === true) { this.setState({base: true}); }
  }

  render() {
    const { showAlert, alertStyle, alertMsg} = this.state;
    if (this.state.base) { return (<Alert className='hideAlert' /> ); }
    else { return (<Alert className={showAlert ? 'showAlert' : 'hideAlert'} bsStyle={alertStyle}>{alertMsg}</Alert> ); }
  }
}

export default AssemblAlert;