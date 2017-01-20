import React from 'react';
import { Translate } from 'react-redux-i18n';

class Community extends React.Component {
  render() {
    return (
      <p><Translate value="community.panelTitle" /></p>
    );
  }
}

export default Community;