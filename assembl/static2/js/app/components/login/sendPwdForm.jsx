import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { requestPasswordChangeAction } from '../../actions/authenticationActions';
import inputHandler from '../../utils/inputHandler';
import { displayAlert } from '../../utils/utilityManager';

class SendPwdForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { identifier: null };
    this.submitHandler = this.submitHandler.bind(this);
    this.handleInput = this.handleInput.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { auth } = nextProps;
    const resp = auth.passwordChangeRequest;
    if (resp && resp.success === false) {
      const firstError = resp.data[0];
      let msg;
      if (firstError.type === 'nonJson') {
        msg = I18n.t('login.somethingWentWrong');
      } else {
        msg = firstError.message;
      }
      displayAlert('danger', msg, true);
    }
  }

  handleInput(e) {
    inputHandler(this, e);
  }

  submitHandler(e) {
    e.preventDefault();
    this.props.sendRequest(this.state.identifier, getDiscussionSlug());
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
                type="text"
                name="identifier"
                required
                placeholder={I18n.t('login.username')}
                onChange={this.handleInput}
              />
            </FormGroup>
            <FormGroup>
              <Button
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

const mapStateToProps = state => ({
  auth: state.auth
});

const mapDispatchToProps = dispatch => ({
  sendRequest: (id, discussionSlug) => dispatch(requestPasswordChangeAction(id, discussionSlug))
});

export default connect(mapStateToProps, mapDispatchToProps)(SendPwdForm);