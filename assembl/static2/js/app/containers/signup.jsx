import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import SignupForm from '../components/login/signupForm';
import SignUpConfirm from '../components/login/signUpConfirm';

class Signup extends React.Component {
  render() {
    const isAccountCreated = location.hash === '#success';
    return (
      <Grid fluid className="login-container">
        <Row className="max-container">
          <Col xs={12} md={6} className="col-centered">
            {!isAccountCreated && <SignupForm />}
            {isAccountCreated && <SignUpConfirm />}
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default Signup;