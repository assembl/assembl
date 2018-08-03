import React, { Component } from 'react';
import Aux from '../../hoc/aux/aux';

class Show extends Component {
  render() {
    return (
      <Aux>
        <div>Navbar section</div>
        <div>Fiction</div>
        <div>Sentiment section</div>
        <div>Comment section</div>
        <div>Debate section</div>
        <div>Footer</div>
      </Aux>
    );
  }
}

export default Show;