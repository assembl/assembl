import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';

class SendPwdForm extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    return (
      <div className="login-view">
        <div className="box-title">
          <Translate value="login.forgotPwd" />
        </div>
        <div className="box">
          <form className="resendPwd" method="POST" action={`${rootPath}${debateData.slug}/changePassword#success`}>
            <FormGroup className="margin-m">
              <FormControl type="text" name="identifier" required placeholder={I18n.t('login.username')} />
            </FormGroup>
            <FormGroup>
              <Button type="submit" name="change_password" value={I18n.t('login.send')} className="button-submit button-dark">
                <Translate value="login.send" />
              </Button>
            </FormGroup>
          </form>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    context: state.context
  };
};

export default connect(mapStateToProps)(SendPwdForm);