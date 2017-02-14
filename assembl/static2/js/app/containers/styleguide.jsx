import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import Menu from '../components/styleguide/menu';
import Buttons from '../components/styleguide/buttons';
import Text from '../components/styleguide/text';
import Icons from '../components/styleguide/icons';
import Dropdown from '../components/styleguide/dropdown';
import Loader from '../components/styleguide/loader';
import Error from '../components/styleguide/error';
import Box from '../components/styleguide/box';
import Container from '../components/styleguide/container';

class Styleguide extends React.Component {
  render() {
    return (
      <Grid>
        <Row>
          <Col xs={12} md={12}>
            <h1 className="dark-title-1 center padding">Assembl Style Guide</h1>
          </Col>
        </Row>
        <div className="margin-m">&nbsp;</div>
        <Row>
          <Col xs={12} md={3}>
            <Menu />
          </Col>
          <Col className="box" xs={12} md={9}>
            <Buttons />
            <Text />
            <Icons />
            <Dropdown />
            <Loader />
            <Error />
            <Box />
            <Container />
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default Styleguide;