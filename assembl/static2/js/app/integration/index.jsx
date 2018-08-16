// @flow
import React from 'react';
import { Grid, Row, Col, ListGroup } from 'react-bootstrap';

const index = () => (
  <Grid>
    <Row>
      <Col xs={12}>
        <h1>Integration page</h1>
      </Col>
    </Row>
    <Row>
      <Col xs={12}>
        <h2>Instruction page</h2>
        <ListGroup componentClass="ul">
          <li>
            <a href="/integration/101/index">HTML/CSS/React components integration 101</a>
          </li>
          <li>
            <a href="/integration/101/form-builder">Form builder example</a>
          </li>
        </ListGroup>
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