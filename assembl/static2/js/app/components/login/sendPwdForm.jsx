import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';
import inputHandler from '../../utils/inputHandler';
import { requestPasswordChangeAction } from '../../actions/authenticationActions';

class SendPwdForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { identifier: null };
    this.submitHandler = this.submitHandler.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.messageHandler = this.messageHandler.bind(this);
  }

  handleInput(e) {
    inputHandler(this, e);
  }

  /*
    TODO: Remove this method and the <div> section in the ReactDOM when the alert system
    is implemented
  */
  messageHandler() {
    return (
      <div>
        {
          this.props.auth.passwordChangeRequest.success == null ? <span /> :
          <div id="sendPwdForm-error"><Translate value="login.passwordChangeRequestError" /></div>
        }
      </div>
    );
  }

  submitHandler(e) {
    e.preventDefault();
    this.props.sendRequest(this.state.identifier);
    // TODO: Implement Alert system in case of failure
  }

  render() {
    return (
      <div className="login-view">
        <div className="box-title">
          <Translate value="login.forgotPwd" />
        </div>
        <div className="box">
          <form className="resendPwd" onSubmit={this.submitHandler}>
            <input type="hidden" name="referer" value="v2" />
            <FormGroup className="margin-m">
              <FormControl
                type="text" name="identifier" required
                placeholder={I18n.t('login.username')} onChange={this.handleInput}
              />
            </FormGroup>
            <FormGroup>
              <Button type="submit" name="send_req_password" value={I18n.t('login.send')} className="button-submit button-dark">
                <Translate value="login.send" />
              </Button>
            </FormGroup>
          </form>
          <div className="error-message">
            {this.messageHandler()}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    auth: state.auth
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    sendRequest: (id) => { return dispatch(requestPasswordChangeAction(id)); }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SendPwdForm);