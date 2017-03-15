import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import SendPwdForm from '../components/login/sendPwdForm';
import SendPwdConfirm from '../components/login/sendPwdConfirm';
import get from 'lodash/get';

class ChangePassword extends React.Component {
  render() {
    const isPwdSend = location.hash === '#success';
    let error_message = get(this.props, 'location.query.error', null);
    return (
      <Grid fluid className="login-container">
        <Row className="max-container center">
          <Col xs={12} md={6} className="col-centered">
            {!isPwdSend && <SendPwdForm error_message={error_message} />}
            {isPwdSend && <SendPwdConfirm />}
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default ChangePassword;