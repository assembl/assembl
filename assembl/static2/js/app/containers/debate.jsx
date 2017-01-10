import React from 'react';
import { Translate } from 'react-redux-i18n';

class Debate extends React.Component {
  render() {
    return (
      <p><Translate value="debate.panelTitle" /></p>
    );
  }
}

export default Debate;