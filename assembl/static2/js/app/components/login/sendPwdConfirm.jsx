import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { form, FormGroup, Button } from 'react-bootstrap';

class SendPwdConfirm extends React.Component {
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
            <FormGroup>
              <Button type="submit" name="resend" value={I18n.t('login.resend')} className="button-success">
                <Translate value="login.resend" />
              </Button>
            </FormGroup>
          </form>
        </div>
      </div>
    );
  }
}

export default SendPwdConfirm;