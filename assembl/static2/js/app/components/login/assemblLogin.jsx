import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { get, getFullPath, getContextual } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';

class AsLogin extends React.Component {
  render() {
    const slug = getDiscussionSlug();
    let next;
    if (this.props.next) {
      next = this.props.next;
    } else if (slug) {
      next = get('home', { slug: slug });
    } else {
      next = null;
    }
    return (
      <div>
        <form
          className="login"
          method="POST"
          action={slug ? getFullPath('ctxOldLogin', { slug: slug }) : getFullPath('oldLogin')}
        >
          {next ? <input type="hidden" name="next" value={`${next}`} /> : null}
          <input type="hidden" name="referrer" value="v2" />
          <h4 className="dark-title-4">
            <Translate value="login.alreadyAccount" />
          </h4>
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
          <Link to={slug ? getContextual('requestPasswordChange', { slug: slug }) : get('requestPasswordChange')}>
            <Translate value="login.forgotPwd" />
          </Link>
        </form>
        <div className="signup border-top margin-m">
          <h4 className="dark-title-4 margin-m">
            <Translate value="login.noAccount" />
          </h4>
          <Link className="button-link button-dark margin-s" to={slug ? getContextual('signup', { slug: slug }) : get('signup')}>
            <Translate value="login.signUp" />
          </Link>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  debate: state.debate
});

export default connect(mapStateToProps)(AsLogin);