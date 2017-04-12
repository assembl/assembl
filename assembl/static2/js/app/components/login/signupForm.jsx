import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';
import { Link } from 'react-router';
import { Routes } from '../../routes';
import { signupAction } from '../../actions/authenticationActions';

class SignupForm extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      'name': null,
      'email': null,
      'password1': null,
      'password2': null
    }

    this.signupHandler = this.signupHandler.bind(this);
    this.inputHandler = this.inputHandler.bind(this);
    this.errorMessageHandler = this.errorMessageHandler.bind(this);
  }

  inputHandler(e){
    let s = {};
    const name = e.target.name;
    s[name] = e.target.value;
    this.setState(s);
  }
  
  signupHandler(e){
    e.preventDefault();
    this.props.signUp(this.state);
  }

  errorMessageHandler(data){
    if (data.success === false) {
      //Add more cases to this switch statement, as needed
      switch (data.reason){
        case 'password': {
          return I18n.t('login.incorrectPassword')
        }
        default: {
          return I18n.t('login.somethingWentWrong')
        }
      }
    }
  }

  render() {
    const { debateData } = this.props.debate;
    const { auth } = this.props;
    return (
      <div className="login-view">
        <div className="box-title">{debateData.topic}</div>
        <div className="box">
          <form className="signup" onSubmit={this.signupHandler}>
            <FormGroup className="margin-m">
              <FormControl type="text" name="name" required
                           placeholder={I18n.t('login.fullName')} onChange={this.inputHandler}/>
            </FormGroup>
            <FormGroup>
              <FormControl type="text" name="username"
                           placeholder={I18n.t('login.userName')} onChange={this.inputHandler}/>
            </FormGroup>

            <FormGroup>
              <FormControl type="email" name="email" required
                           placeholder={I18n.t('login.email')} onChange={this.inputHandler}/>
            </FormGroup>
            <FormGroup>
              <FormControl type="password" name="password1" required
                           placeholder={I18n.t('login.password')} onChange={this.inputHandler}/>
            </FormGroup>
            <FormGroup>
              <FormControl type="password" name="password2" required
                           placeholder={I18n.t('login.password2')} onChange={this.inputHandler}/>
            </FormGroup>
            <FormGroup>
              <Button type="submit"
                      name="register"
                      value={I18n.t('login.signUp')}
                      className="button-submit button-dark">
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
          <div>
            {this.errorMessageHandler(auth)}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    context: state.context,
    auth: state.auth
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    signUp: (payload) => {
      dispatch(signupAction(payload));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SignupForm);