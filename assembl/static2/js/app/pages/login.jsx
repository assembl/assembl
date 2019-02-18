// @flow
import React from 'react';
import { Grid, Col } from 'react-bootstrap';
import get from 'lodash/get';
import { I18n } from 'react-redux-i18n';
// Route helpers imports
import { browserHistory } from '../../app/router';

import AssemblLogin from '../components/login/assemblLogin';
import { SocialMedia } from '../components/login/socialMediaLogin';
import { getProvidersData, getDiscussionSlug, getPossibleErrorMessage } from '../utils/globalFunctions';
import { displayAlert } from '../utils/utilityManager';
import BackButton from '../components/debate/common/backButton';

type Props = {
  location: RouterPath
};

class Login extends React.Component<Props> {
  componentDidMount() {
    const error = getPossibleErrorMessage();
    if (error) {
      displayAlert('danger', error, true);
    }
  }

  render() {
    const { location } = this.props;
    const slug = getDiscussionSlug();
    const providers = getProvidersData();
    const next = get(location, 'query.next', null);
    // Disable social media login for contextless login until post-login path
    // is determined
    // TODO: Determine contextless social media login action
    const hasSocialMedias = providers && slug && providers.length > 0;

    const backBtnCallback = () => {
      browserHistory.goBack();
    };

    return (
      <Grid fluid className="login-grid">
        <Col xs={12} sm={hasSocialMedias ? 9 : 6} lg={hasSocialMedias ? 7 : 4} className="login-container test col-centered">
          <BackButton handleClick={backBtnCallback} linkClassName="back-btn" />
          <div className="box-title margin-l">{I18n.t('login.login')}</div>
          <div className="box">
            {hasSocialMedias && (
              <div>
                <Col xs={12} md={5}>
                  {slug ? (
                    <SocialMedia providers={providers} next={next} slug={slug} />
                  ) : (
                    <SocialMedia providers={providers} next={next} />
                  )}
                </Col>
                <Col xs={12} md={1}>
                  &nbsp;
                </Col>
              </div>
            )}
            <Col xs={12} md={hasSocialMedias ? 6 : 12}>
              <AssemblLogin next={next} slug={slug} />
            </Col>
            <div className="clear">&nbsp;</div>
          </div>
        </Col>
      </Grid>
    );
  }
}

export default Login;