// @flow
import * as React from 'react';
import { ChromePicker as ColorPicker } from 'react-color';
import { FormGroup } from 'react-bootstrap';

import { type FieldRenderProps } from 'react-final-form';
import { getValidationState } from './utils';
import { pickerColors } from '../../constants';
import Error from './error';

type Props = {
  name: string,
  label: string,
  input: {
    name: string,
    onChange: Function,
    value: string
  }
} & FieldRenderProps;

const ColorPickerFieldAdapter = ({ meta: { error, touched }, input: { name, onChange, value }, label }: Props) => {
  const onChangeColor = (v) => {
    onChange(v.hex);
  };
  return (
    <FormGroup controlId={name} validationState={getValidationState(error, touched)}>
      <label htmlFor={`color-picker-${name}`}>{label}</label>
      <ColorPicker
        colors={pickerColors}
        color={value}
        width="100%"
        id={`color-picker-${name}`}
        triangle="hide"
        className="no-box-shadow"
        onChange={onChangeColor}
      />
      <Error name={name} />
    </FormGroup>
  );
};

export default ColorPickerFieldAdapter;