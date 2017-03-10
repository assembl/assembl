import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import get from 'lodash/get';
import AsLogin from '../components/login/assemblLogin';

class Login extends React.Component {
  render() {
    let next = get(this.props, 'location.query.next', null);
    return (
      <Grid fluid className="login-container">
        <Row className="max-container center">
          <Col xs={12} md={6} className="col-centered">
            { next ?
              <AsLogin next={next}/>
              : <AsLogin/>
            }
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default Login;