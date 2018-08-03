import React from 'react';
import { Grid, Row, Col, ListGroup } from 'react-bootstrap';

const index = () => (
  <Grid className="integration">
    <Row>
      <Col xs={12}>
        <h1>Integration page</h1>
      </Col>
    </Row>
    <Row>
      <Col xs={12}>
        <h2>Bright Mirror pages</h2>
        <ListGroup componentClass="ul">
          <li>
            <a href="/integration/bright-mirror/index">Index page</a>
          </li>
          <li>
            <a href="/integration/bright-mirror/show">Show page</a>
          </li>
        </ListGroup>
      </Col>
    </Row>
  </Grid>
);

export default index;