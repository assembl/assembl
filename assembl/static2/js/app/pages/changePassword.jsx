/* eslint no-alert: "off" */

import React from 'react';
import { Grid, Row, Col, FormGroup, FormControl, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { getAuthorizationToken } from '../utils/globalFunctions';
import { postChangePassword } from '../services/authenticationService';
import inputHandler from '../utils/inputHandler';
import { get } from '../utils/routeMap';

class ChangePassword extends React.Component {
  constructor(props) {
    super(props);
    this.handleChangePassword = this.handleChangePassword.bind(this);
    this.submitForm = this.submitForm.bind(this);

    this.state = {
      token: getAuthorizationToken()
    };
  }

  handleChangePassword(e) {
    inputHandler(this, e);
  }

  submitForm(e) {
    e.preventDefault();
    const payload = this.state;
    const that = this;
    postChangePassword(payload).then(() => {
      const slug = that.props.params.slug;
      if (slug) {
        const route = `/${get('home', { slug: slug })}`;
        const url = new URL(route, window.location.href);
        window.location = url;
      }
      // Get a slug, reload to the home_view
      // If no slug, go to forbidden page...
    })
    .catch((error) => {
      try {
        const resp = JSON.parse(error);
        // TODO: Use the new Alert system from Phase1 branch
        alert(resp.error.error);
      } catch (exception) {
        // TODO: Use the new Alert system from Phase1 branch
        alert(exception);
      }
    });
  }

  render() {
    return (
      <div>
        <div className="box-title">
          <Translate value="login.changePassword" />
        </div>
        <div className="box">
          <Grid fluid className="login-container">
            <Row className="max-container center">
              <Col xs={12} md={6} className="col-centered">
                <form>
                  <FormGroup className="margin-m">
                    <FormControl type="text" name="password1" required onChange={this.handleChangePassword} />
                  </FormGroup>
                  <FormGroup className="margin-m">
                    <FormControl type="text" name="password2" required onChange={this.handleChangePassword} />
                  </FormGroup>
                  <FormGroup>
                    <Button
                      type="submit"
                      name="change_password"
                      value={I18n.t('login.send')} className="button-submit button-dark"
                      onClick={this.submitForm}
                    >
                      <Translate value="login.send" />
                    </Button>
                  </FormGroup>
                </form>
              </Col>
            </Row>
          </Grid>
        </div>
      </div>
    );
  }
}


export default ChangePassword;