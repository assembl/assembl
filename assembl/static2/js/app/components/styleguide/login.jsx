import React from 'react';
import ProfileIcon from '../common/profileIcon';

class Login extends React.Component {
  render() {
    return (
      <div>
        <h2 className="title-2 underline" id="login">LOGIN</h2>
        <section>
          <div className="left">
            <ProfileIcon />
          </div>
          <div>&nbsp;</div>
        </section>
        <section>
          <h3 className="title-3">Code</h3>
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