import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import get from 'lodash/get';
import AsLogin from '../components/login/assemblLogin';

class Login extends React.Component {
  render() {
    let next = get(this.props, 'location.query.next', null);
    let error_message = get(this.props, 'location.query.error', null);
    return (
      <Grid fluid className="login-container">
        <Row className="max-container center">
          <Col xs={12} md={6} className="col-centered">
            <AsLogin next={next} error_message={error_message} />
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default Login;