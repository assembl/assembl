import React from 'react';
import { Grid } from 'react-bootstrap';
import AsLogin from '../components/login/assemblLogin';

class Login extends React.Component {
  render() {
    return (
      <Grid fluid>
        <div className="max-container center">
          <AsLogin />
        </div>
      </Grid>
    );
  }
}

export default Login;