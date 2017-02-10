import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import MapStateToProps from '../../store/mapStateToProps';

class AsLogin extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    return (
      <div className="login-view">
        <div className="box-title">{debateData.topic}</div>
        <div className="box">
          <form className="login" method="POST" action={`${rootPath}${debateData.slug}/home`}>
            <h4 className="title-4"><Translate value="login.alreadyAccount" /></h4>
            <FormGroup className="margin-m">
              <FormControl type="text" name="identifier" placeholder={I18n.t('login.username')} />
            </FormGroup>
            <FormGroup>
              <FormControl type="password" name="password" placeholder={I18n.t('login.password')} />
            </FormGroup>
            <FormGroup>
              <Button type="submit" name="login" value={I18n.t('login.login')} className="button-success">
                <Translate value="login.login" />
              </Button>
            </FormGroup>
            <Link to={`${rootPath}${debateData.slug}/changePassword`}>
              <Translate value="login.forgotPwd" />
            </Link>
          </form>
          <div className="signup">
            <h4 className="title-4"><Translate value="login.noAccount" /></h4>
            <Link className="button-link margin-s" to={`${rootPath}${debateData.slug}/signup`}>
              <Translate value="login.signUp" />
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(MapStateToProps)(AsLogin);