import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import Menu from '../components/styleguide/menu';
import Buttons from '../components/styleguide/buttons';
import Titles from '../components/styleguide/titles';
import Icons from '../components/styleguide/icons';
import Login from '../components/styleguide/login';
import Dropdown from '../components/styleguide/dropdown';
import Loader from '../components/styleguide/loader';
import Error from '../components/styleguide/error';
import Container from '../components/styleguide/container';

class Styleguide extends React.Component {
  render() {
    return (
      <Grid>
        <Row>
          <Col xs={12} md={12}>
            <div className="title-1 center padding">Assembl Style Guide</div>
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={3}>
            <Menu />
          </Col>
          <Col className="box" xs={12} md={9}>
            <Buttons />
            <Titles />
            <Icons />
            <Login />
            <Dropdown />
            <Loader />
            <Error />
            <Container />
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default Styleguide;