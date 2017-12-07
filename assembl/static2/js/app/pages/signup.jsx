import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import SignupForm from '../components/login/signupForm';
import SignUpConfirm from '../components/login/signUpConfirm';

class Signup extends React.Component {
  render() {
    let signupConfirm = false;
    // Data has been fetched from the backend
    if ('signupSuccess' in this.props.auth) {
      if (this.props.auth.signupSuccess.success === true) {
        signupConfirm = this.props.auth.signupSuccess.success;
      }
    }
    return (
      <Grid fluid className="login-container">
        <Row className="max-container center">
          <Col xs={12} md={6} className="col-centered">
            {signupConfirm ? <SignUpConfirm /> : <SignupForm />}
          </Col>
        </Row>
      </Grid>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(Signup);