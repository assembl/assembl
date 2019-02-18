import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { form, FormGroup, Button } from 'react-bootstrap';
// Route helper import
import { browserHistory } from '../../../app/router';

import BackButton from '../debate/common/backButton';

class SignUpConfirm extends React.Component {
  // TODO: Move state from signup form to signup page so this component will
  // have access to that information as well.
  render() {
    const backBtnCallback = () => {
      browserHistory.goBack();
    };

    return (
      <div className="login-view">
        <BackButton handleClick={backBtnCallback} linkClassName="back-btn" />
        <div className="box-title margin-l">
          <Translate value="login.accountCreated" />
        </div>
        <div className="box">
          <form className="resendPwd">
            <FormGroup>
              <Translate value="login.accountCreatedMsg" />
            </FormGroup>
            {false && (
              <FormGroup>
                <Button type="submit" name="resend" value={I18n.t('login.resend')} className="margin-m button-submit button-dark">
                  <Translate value="login.resend" />
                </Button>
              </FormGroup>
            )}
          </form>
        </div>
      </div>
    );
  }
}

export default SignUpConfirm;