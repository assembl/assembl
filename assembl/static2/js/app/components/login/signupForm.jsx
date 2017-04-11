import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';
import { Link } from 'react-router';
import { Routes } from '../../routes';

class SignupForm extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    return (
      <div className="login-view">
        <div className="box-title">{debateData.topic}</div>
        <div className="box">
          <form className="signup" method="POST" action={Routes.getContextual('signup', {slug: debateData.slug})}>
            <FormGroup className="margin-m">
              <FormControl type="text" name="name" required placeholder={I18n.t('login.fullName')} />
            </FormGroup>
            <FormGroup>
              <FormControl type="email" name="email" required placeholder={I18n.t('login.email')} />
            </FormGroup>
            <FormGroup>
              <FormControl type="password" name="password" required placeholder={I18n.t('login.password')} />
            </FormGroup>
            <FormGroup>
              <FormControl type="password" name="password2" required placeholder={I18n.t('login.password2')} />
            </FormGroup>
            <FormGroup>
              <Button type="submit" name="register" value={I18n.t('login.signUp')} className="button-submit button-dark">
                <Translate value="login.signUp" />
              </Button>
            </FormGroup>
            <FormGroup>
              <Translate value="login.alreadyAccount" />
              <span>&nbsp;</span>
              <Link to={Routes.getContextual('login', {slug: debateData.slug})}>
                <Translate value="login.login" />
              </Link>
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

export default connect(mapStateToProps)(SignupForm);