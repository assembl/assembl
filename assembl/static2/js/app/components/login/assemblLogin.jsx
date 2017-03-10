import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

class AsLogin extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    const next = "next" in this.props ? this.props.next : `${rootPath}${debateData.slug}/home` ;
    return (
      <div className="login-view">
        <div className="box-title">{debateData.topic}</div>
        <div className="box">
          <form className="login" method="POST" action={`/${debateData.slug}/login`}>
            { next ?
              <input type="hidden" name="next" value={`${next}`} />
              : null }
            <h4 className="dark-title-4"><Translate value="login.alreadyAccount" /></h4>
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
            <Link to={`${rootPath}${debateData.slug}/changePassword`}>
              <Translate value="login.forgotPwd" />
            </Link>
          </form>
          <div className="signup">
            <h4 className="dark-title-4"><Translate value="login.noAccount" /></h4>
            <Link className="button-link button-dark margin-s" to={`${rootPath}${debateData.slug}/signup`}>
              <Translate value="login.signUp" />
            </Link>
          </div>
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