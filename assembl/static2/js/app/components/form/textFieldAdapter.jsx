// @flow
/*
  Text field adapter for react-final-form
*/
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, FormGroup, FormControl } from 'react-bootstrap';

import Error from './error';
import { getValidationState } from './utils';

type Props = {
  input: {
    name: string,
    onBlur: (?SyntheticFocusEvent<*>) => void,
    onChange: (SyntheticInputEvent<*> | any) => void,
    onFocus: (?SyntheticFocusEvent<*>) => void,
    value: string
  },
  label: string
} & FieldRenderProps;

const TextFieldAdapter = ({
  input: { name, onChange, value, ...otherListeners },
  label,
  meta: { error, touched },
  ...rest
}: Props) => (
  <FormGroup controlId={name} validationState={getValidationState(error, touched)}>
    {value ? <ControlLabel>{label}</ControlLabel> : null}
    <FormControl
      {...otherListeners}
      {...rest}
      onChange={event => onChange(event.target.value)}
      placeholder={label}
      value={value}
    />
    <Error name={name} />
  </FormGroup>
);

export default TextFieldAdapter;