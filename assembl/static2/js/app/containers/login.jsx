import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import AsLogin from '../components/login/assemblLogin';

class Login extends React.Component {
  render() {
    return (
      <Grid fluid>
        <Row className="max-container center">
          <Col xs={12} md={6} className="col-centered">
            <AsLogin />
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default Login;