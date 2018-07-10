// @flow
/*
  Text field adapter for react-final-form
*/
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, FormGroup, FormControl, HelpBlock } from 'react-bootstrap';

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
  <FormGroup validationState={getValidationState(error, touched)}>
    {value ? <ControlLabel htmlFor={name}>{label}</ControlLabel> : null}
    <FormControl
      {...otherListeners}
      {...rest}
      onChange={event => onChange(event.target.value)}
      placeholder={label}
      value={value}
    />
    {touched && error ? <HelpBlock>{error}</HelpBlock> : null}
  </FormGroup>
);

export default TextFieldAdapter;