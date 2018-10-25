// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';

import { getDiscussionSlug } from '../../utils/globalFunctions';
import { displayAlert } from '../../utils/utilityManager';
import { type ChangePasswordResponse } from '../../pages/requestPasswordChange';

type Props = {
  passwordChangeResponse: ChangePasswordResponse,
  requestPasswordChange: (string, string) => void
};

type State = {
  identifier: string | null
};

class RequestNewPasswordForm extends React.Component<Props, State> {
  state = { identifier: null };

  componentWillReceiveProps(nextProps: Props) {
    const { passwordChangeResponse } = nextProps;
    // we explicitely check if success is false because it can be null if the request has not been set yet
    if (passwordChangeResponse.success === false && passwordChangeResponse.data.length > 0) {
      const firstError = passwordChangeResponse.data[0];
      let msg;
      if (firstError.type === 'nonJson') {
        msg = I18n.t('login.somethingWentWrong');
      } else {
        msg = firstError.message;
      }
      displayAlert('danger', msg, true);
    }
  }

  handleIdentifierChange = (e: SyntheticEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    this.setState(() => ({
      identifier: value
    }));
  };

  handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    const { requestPasswordChange } = this.props;
    const { identifier } = this.state;
    const slug = getDiscussionSlug();
    e.preventDefault();
    if (identifier && slug) {
      requestPasswordChange(identifier, slug);
    }
  };

  render() {
    return (
      <div className="login-view">
        <div className="box-title">
          <Translate value="login.forgotPwd" />
        </div>
        <div className="box">
          <form className="resendPwd" onSubmit={this.handleSubmit}>
            <input type="hidden" name="referer" value="v2" />
            <FormGroup className="margin-m">
              <FormControl
                type="text"
                name="identifier"
                required
                placeholder={I18n.t('login.username')}
                onChange={this.handleIdentifierChange}
                value={this.state.identifier}
              />
            </FormGroup>
            <FormGroup>
              <Button
                disabled={!this.state.identifier}
                type="submit"
                name="send_req_password"
                value={I18n.t('login.send')}
                className="button-submit button-dark margin-m"
              >
                <Translate value="login.send" />
              </Button>
            </FormGroup>
          </form>
        </div>
      </div>
    );
  }
}

export default RequestNewPasswordForm;