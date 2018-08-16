// @flow
import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';

type Props = {};

class FormBuilder101 extends Component<Props> {
  render() {
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <h1>Form builder example</h1>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default FormBuilder101;