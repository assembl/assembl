// @flow
import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';

// Components for the main project should be created in the component folder in static2/js/app/components
// Stories for the main project should be created in the stories folder in static2/js/app/stories
// The import path used below is only used as an example for instruction purpose
import Button101 from '../../components/button101/button101';
import CheckboxList101 from '../../components/checkboxList101/checkboxList101';

type Props = {};

const listOfcheckboxes = [
  { label: 'AAA', isDone: false },
  { label: 'BBB', isDone: false },
  { label: 'CCC', isDone: true },
  { label: 'DDD', isDone: false },
  { label: 'EEE', isDone: false }
];

class FormBuilder101 extends Component<Props> {
  logButtonHandler = () => {
    /* eslint-disable */
    console.log(`It's working !`);
    /* eslint-enable */
  };

  logCheckboxHandler = (event: SyntheticEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    const isChecked = target.checked;
    /* eslint-disable */
    console.log(`It's working ! ${isChecked.toString()}`);
    /* eslint-enable */
  };

  render() {
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <h1>Form builder example</h1>
            <p>
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry
              standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a
              type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting,
              remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing
              Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of
              Lorem Ipsum.
            </p>
          </Col>
          <Button101 onClickHandler={this.logButtonHandler} />
          <CheckboxList101 checkboxes={listOfcheckboxes} onChangeHandler={this.logCheckboxHandler} />
        </Row>
      </Grid>
    );
  }
}

export default FormBuilder101;