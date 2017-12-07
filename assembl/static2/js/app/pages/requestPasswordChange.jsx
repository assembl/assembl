import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import SendPwdForm from '../components/login/sendPwdForm';
import SendPwdConfirm from '../components/login/sendPwdConfirm';

class RequestPasswordChange extends React.Component {
  render() {
    const { auth } = this.props;
    let pwdSendConfirm = null;
    if ('passwordChangeRequest' in auth) {
      if (auth.passwordChangeRequest.success !== null) {
        pwdSendConfirm = auth.passwordChangeRequest.success;
      }
    }
    return (
      <Grid fluid className="login-container">
        <Row className="max-container center">
          <Col xs={12} md={6} className="col-centered">
            {pwdSendConfirm ? <SendPwdConfirm /> : <SendPwdForm />}
          </Col>
        </Row>
      </Grid>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(RequestPasswordChange);