import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { Routes } from '../../routes';

class AsLogin extends React.Component {
  render() {
    const slug = this.props.slug;
    const next = ("next" in this.props && this.props.next) ? this.props.next : Routes.getFullPath('home', {slug}) ;
    const error_message = ("error_message" in this.props  && this.props.error_message) ? this.props.error_message : null;
    return (
      <div>
        <form className="login" method="POST" action={ Routes.getContextual('login', {slug: slug}) }>
          { next ?
            <input type="hidden" name="next" value={`${next}`} />
            : null }
          <input type="hidden" name="referer" value="v2" />
          <h4 className="dark-title-4"><Translate value="login.alreadyAccount" /></h4>
          { error_message ? <div className="error-message">{error_message}</div> : null }
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
          <Link to={Routes.getContextual('signup', {slug} )}>
            <Translate value="login.forgotPwd" />
          </Link>
        </form>
        <div className="signup">
          <h4 className="dark-title-4"><Translate value="login.noAccount" /></h4>
          <Link className="button-link button-dark margin-s" to={Routes.getContextual('signup', {slug} )}>
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