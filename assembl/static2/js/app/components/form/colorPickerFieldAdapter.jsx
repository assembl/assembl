// @flow
import * as React from 'react';
import { BlockPicker as ColorPicker } from 'react-color';
import { FormGroup } from 'react-bootstrap';

import { type FieldRenderProps } from 'react-final-form';
import { getValidationState } from './utils';
import { pickerColors } from '../../constants';
import Error from './error';

type Props = {
  name: string,
  color: string,
  input: {
    name: string,
    onChange: Function,
    value: string
  }
} & FieldRenderProps;

const ColorPickerFieldAdapter = ({ color, meta: { error, touched }, input: { name } }: Props) => (
  <FormGroup controlId={name} validationState={getValidationState(error, touched)}>
    <ColorPicker
      colors={pickerColors}
      color={color}
      width="100%"
      id={`color-picker-${name}`}
      triangle="hide"
      className="no-box-shadow"
    />
    <Error name={name} />
  </FormGroup>
);

export default ColorPickerFieldAdapter;