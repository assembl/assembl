import React from 'react';
import { Translate } from 'react-redux-i18n';

class Home extends React.Component {
  render() {
    return (
      <p><Translate value="home.panelTitle" /></p>
    );
  }
}

export default Home;