// @flow
import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';

// Components for the main project should be created in the component folder in static2/js/app/components
// Stories for the main project should be created in the stories folder in static2/js/app/stories
// The import path used below is only used as an example for instruction purpose
import Button101 from '../../components/button101/button101';
import CheckboxList101 from '../../components/checkboxList101/checkboxList101';

import type { Button101Type } from '../../components/button101/button101';
import type { Checkbox101Type } from '../../components/checkbox101/checkbox101';
import type { CheckboxList101Type } from '../../components/checkboxList101/checkboxList101';

type FormBuilder101Type = {};

const defaultButton: Button101Type = {
  label: 'Custom label',
  isDisabled: false,
  type: 'info',
  /* eslint-disable */
  onClickHandler: () => console.log('button tapped')
  /* eslint-enable */
};

const defaultCheckbox: Checkbox101Type = {
  /* eslint-disable */
  onChangeHandler: () => console.log('checkbox changed')
  /* eslint-enable */
};

const defaultCheckboxList: CheckboxList101Type = {
  checkboxes: [
    { ...defaultCheckbox, label: 'AAA', isDone: false },
    { ...defaultCheckbox, label: 'BBB', isDone: false },
    { ...defaultCheckbox, label: 'CCC', isDone: true },
    { ...defaultCheckbox, label: 'DDD', isDone: false },
    { ...defaultCheckbox, label: 'EEE', isDone: false }
  ]
};

class FormBuilder101 extends Component<FormBuilder101Type> {
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
          <Button101 {...defaultButton} />
          <CheckboxList101 {...defaultCheckboxList} />
        </Row>
      </Grid>
    );
  }
}

export default FormBuilder101;