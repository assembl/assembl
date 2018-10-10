// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { form, FormGroup } from 'react-bootstrap';

class SendPwdConfirm extends React.Component<{}> {
  render() {
    return (
      <div className="login-view">
        <div className="box-title">
          <Translate value="login.sendPwdConfirm" />
        </div>
        <div className="box">
          <form className="resendPwd" method="POST">
            <FormGroup>
              <Translate value="login.sendPwdMsg" />
            </FormGroup>
          </form>
        </div>
      </div>
    );
  }
}

export default SendPwdConfirm;