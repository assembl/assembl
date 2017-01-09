import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import Menu from '../components/styleguide/menu';
import Buttons from '../components/styleguide/buttons';
import Titles from '../components/styleguide/titles';
import Navbar from '../components/styleguide/navbar';

const Styleguide = () => (
  <Grid>
    <Row>
      <Col xs={12} md={12}>
        <div className="title-1 center padding">Assembl Style Guide</div>
      </Col>
    </Row>
    <Row>
      <Col xs={12} md={4}>
        <Menu />
      </Col>
      <Col xs={12} md={8}>
        <Buttons />
        <Titles />
        <Navbar />
      </Col>
    </Row>
  </Grid>
);

export default Styleguide;