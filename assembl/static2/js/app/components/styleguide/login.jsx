import React from 'react';
import ProfileIcon from '../common/profileIcon';

class Login extends React.Component {
  render() {
    return (
      <div>
        <div className="title-2 underline" id="login">LOGIN</div>
        <section>
          <div className="left">
            <ProfileIcon />
          </div>
          <div>&nbsp;</div>
        </section>
        <section>
          <div className="title-3">Code</div>
          <div className="box">
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>ProfileIcon /</span>
                <span>&gt;</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Login;