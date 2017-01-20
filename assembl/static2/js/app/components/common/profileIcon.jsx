import React from 'react';

class ProfileIcon extends React.Component {
  render() {
    return (
      <div className="right profile-icon">
        <a href="#">
          <img src="../../../../static2/css/img/default_avatar.png" alt="avatar" />
          <span className="username">User name</span>
        </a>
      </div>
    );
  }
}
export default ProfileIcon;