// @flow
import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';

// Components for the main project should be created in the component folder in static2/js/app/components
// Stories for the main project should be created in the stories folder in static2/js/app/stories
// The import path used below is only used as an example for instruction purpose
import Button101 from '../../components/button101/button101';

type Props = {};

class FormBuilder101 extends Component<Props> {
  buttonTappedHandler = () => {
    /* eslint-disable */
    console.log('It\'s working !');
    /* eslint-enable */
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <h1>Form builder example</h1>
            <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
            <p className="text-center">
              <Button101 buttonTappedHandler={this.buttonTappedHandler} />
            </p>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default FormBuilder101;