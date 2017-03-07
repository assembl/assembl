import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid, Col } from 'react-bootstrap';

class Profile extends React.Component {
  render() {
    return (
      <Grid fluid>
        <div className="max-container">
          <Col xs={12} sm={12}>
            <Translate value="profile.panelTitle" />
          </Col>
        </div>
      </Grid>
    );
  }
}

export default Profile;