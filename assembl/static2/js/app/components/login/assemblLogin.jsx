import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import Routes from '../../utils/routeMap';

class AsLogin extends React.Component {
  render() {
    const { slug } = this.props;
    const next = this.props.next ? this.props.next : Routes.get('home', { slug: slug });
    const errorMessage = ('error_message' in this.props && this.props.error_message) ? this.props.error_message : null;
    return (
      <div>
        <form className="login" method="POST" action={Routes.getFullPath('ctxOldLogin', { slug: slug })}>
          { next ?
            <input type="hidden" name="next" value={`${next}`} />
            : null }
          <input type="hidden" name="referer" value="v2" />
          <h4 className="dark-title-4">
            <Translate value="login.alreadyAccount" />
          </h4>
          { errorMessage ? <div className="error-message">{errorMessage}</div> : null }
          <FormGroup className="margin-m">
            <FormControl type="text" name="identifier" required placeholder={I18n.t('login.username')} />
          </FormGroup>
          <FormGroup>
            <FormControl type="password" name="password" required placeholder={I18n.t('login.password')} />
          </FormGroup>
          <FormGroup>
            <Button type="submit" name="login" value={I18n.t('login.login')} className="button-submit button-dark">
              <Translate value="login.login" />
            </Button>
          </FormGroup>
          <Link to={slug ? Routes.getContextual('requestPasswordChange', { slug: slug }) : Routes.get('requestPasswordChange')}>
            <Translate value="login.forgotPwd" />
          </Link>
        </form>
        <div className="signup border-top margin-m">
          <h4 className="dark-title-4 margin-m">
            <Translate value="login.noAccount" />
          </h4>
          <Link
            className="button-link button-dark margin-s"
            to={slug ? Routes.getContextual('signup', { slug: slug }) : Routes.get('signup')}
          >
            <Translate value="login.signUp" />
          </Link>
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

export default connect(mapStateToProps)(AsLogin);