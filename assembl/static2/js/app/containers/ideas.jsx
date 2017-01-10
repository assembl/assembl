import React from 'react';
import { Translate } from 'react-redux-i18n';

class Ideas extends React.Component {
  render() {
    return (
      <p><Translate value="ideas.panelTitle" /></p>
    );
  }
}

export default Ideas;