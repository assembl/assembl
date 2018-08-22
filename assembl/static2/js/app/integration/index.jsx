// @flow
import React from 'react';
import { Link } from 'react-router';
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
            <Link to="/integration/101/index">HTML/CSS/React components integration 101</Link>
          </li>
          <li>
            <Link to="/integration/101/form-builder">Form builder example</Link>
          </li>
        </ListGroup>
      </Col>
    </Row>
    <Row>
      <Col xs={12}>
        <h2>Bright Mirror pages</h2>
        <ListGroup componentClass="ul">
          <li>
            <Link to="/integration/bright-mirror/bright-mirror-fiction">Fiction page</Link>
          </li>
        </ListGroup>
      </Col>
    </Row>
  </Grid>
);

export default index;