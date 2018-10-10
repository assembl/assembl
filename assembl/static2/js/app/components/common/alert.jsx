// @flow
import React from 'react';
import { Alert } from 'react-bootstrap';

type Props = {
  isBase: boolean
};

type State = {
  showAlert?: boolean,
  topPosition?: boolean,
  alertMsg?: string,
  base: boolean,
  alertStyle?: string
};

class AssemblAlert extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      base: true
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.isBase) {
      this.setState({
        base: true
      });
    }
  }

  render() {
    const { showAlert, alertStyle, alertMsg, topPosition, base } = this.state;
    if (base) {
      return <Alert className="hideAlert" />;
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