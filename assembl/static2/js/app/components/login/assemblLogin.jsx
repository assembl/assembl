// @flow
import React from 'react';
import { Link } from 'react-router';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { get, getFullPath, getContextual } from '../../utils/routeMap';

type Props = {
  next: ?string,
  slug: ?string
};

const AssemblLogin = (props: Props) => {
  const { slug } = props;
  const defaultNext = slug ? get('home', { slug: slug }) : null;
  const next = props.next || defaultNext;
  const login = slug ? getFullPath('ctxOldLogin', { slug: slug }) : getFullPath('oldLogin');
  const requestPasswordChange = slug ? getContextual('requestPasswordChange', { slug: slug }) : get('requestPasswordChange');
  const signUp = slug ? getContextual('signup', { slug: slug }) : get('signup');

  return (
    <div>
      <form className="login" method="POST" action={login}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <input type="hidden" name="referrer" value="v2" />
        <h4 className="dark-title-4">
          <Translate dangerousHTML value="login.alreadyAccount" />
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
        {slug ? (
          <Link to={requestPasswordChange}>
            <Translate value="login.forgotPwd" />
          </Link>
        ) : null}
      </form>
      {slug ? (
        <div className="signup border-top margin-m">
          <h4 className="dark-title-4 margin-m">
            <Translate dangerousHTML value="login.noAccount" />
          </h4>
          <Link className="button-link button-dark margin-s" to={signUp}>
            <Translate value="login.signUp" />
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default AssemblLogin;