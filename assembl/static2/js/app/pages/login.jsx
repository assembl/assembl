import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import get from 'lodash/get';
import { I18n } from 'react-redux-i18n';
import AsLogin from '../components/login/assemblLogin';
import {SocialMedia} from '../components/login/socialMediaLogin';
import { getProvidersData } from '../utils/globalFunctions';

class Login extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const providers = getProvidersData();
    let next = get(this.props, 'location.query.next', null);
    let error_message = get(this.props, 'location.query.error', null);
    return (
      <Grid fluid className="login-container">
        <div className="login-view">
          <div className="box-title">{debateData ? debateData.topic : I18n.t('login.login')}</div>
          <div className="box">
            <Row className="max-container center">
              <Col xs={12} md={6}>
                {providers.length > 0 && <SocialMedia providers={providers} /> }
              </Col>          
              <Col xs={12} md={6}>
                <AsLogin next={next} error_message={error_message}
                  slug={debateData? debateData.slug : null}/>
              </Col>
            </Row>
          </div>
        </div>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    context: state.context
  };
};

export default connect(mapStateToProps)(Login);