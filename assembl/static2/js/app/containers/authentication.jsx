import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';

class Authentication extends React.Component {
  render() {
    return (
      <Grid fluid className="max-container">
        <Row>
          <Col xs={12} sm={12}>
            <Translate value="authentication.panelTitle" />
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default Authentication;