// @flow
import React from 'react';
import { Link } from 'react-router';
import { Grid, Row, Col, ListGroup } from 'react-bootstrap';
import { get } from '../utils/routeMap';

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
            <Link to={`${get('integration101Page')}`}>HTML/CSS/React components integration 101</Link>
          </li>
          <li>
            <Link to={`${get('integration101FormBuilderPage')}`}>Form builder example</Link>
          </li>
        </ListGroup>
      </Col>
    </Row>
    <Row>
      <Col xs={12}>
        <h2>Bright Mirror pages</h2>
        <ListGroup componentClass="ul">
          <li>
            <Link to={`${get('integrationBrightMirrorFiction')}`}>Fiction page</Link>
          </li>
        </ListGroup>
      </Col>
    </Row>
    <Row>
      <Col xs={12}>
        <h2>Semantic Analysis pages</h2>
        <ListGroup componentClass="ul">
          <li>
            <Link to={`${get('integrationSemanticAnalysisThematicPage')}`}>Thematic page (Instruction section only)</Link>
          </li>
        </ListGroup>
      </Col>
    </Row>
  </Grid>
);

export default index;