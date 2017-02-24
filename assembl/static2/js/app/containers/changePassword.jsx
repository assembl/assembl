import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import SendPwdForm from '../components/login/sendPwdForm';
import SendPwdConfirm from '../components/login/sendPwdConfirm';

class ChangePassword extends React.Component {
  render() {
    const isPwdSend = location.hash === '#success';
    return (
      <Grid fluid className="login-container">
        <Row className="max-container">
          <Col xs={12} md={6} className="col-centered">
            {!isPwdSend && <SendPwdForm />}
            {isPwdSend && <SendPwdConfirm />}
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default ChangePassword;