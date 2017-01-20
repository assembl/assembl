import React from 'react';
import { Translate } from 'react-redux-i18n';

class Profile extends React.Component {
  render() {
    return (
      <p><Translate value="profile.panelTitle" /></p>
    );
  }
}

export default Profile;