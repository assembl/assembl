// @flow
/*
  Text field adapter for react-final-form that supports multilingual

  value should have the following form:
  { en: 'Hello', fr: 'Bonjour' }
*/
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { ControlLabel, FormGroup, FormControl, HelpBlock } from 'react-bootstrap';

import { getValidationState } from './utils';

type multilingualValue = { [string]: string };

type Props = {
  editLocale: string,
  input: {
    name: string,
    onBlur: (?SyntheticFocusEvent<*>) => void,
    onChange: (SyntheticInputEvent<*> | any) => void,
    onFocus: (?SyntheticFocusEvent<*>) => void,
    value: multilingualValue
  },
  label: string
} & FieldRenderProps;

const MultilingualTextFieldAdapter = ({
  editLocale,
  input: { name, onChange, value, ...otherListeners },
  label,
  meta: { error, touched },
  ...rest
}: Props) => {
  const valueInLocale = value[editLocale] || '';
  return (
    <FormGroup controlId={name} validationState={getValidationState(error, touched)}>
      {valueInLocale ? <ControlLabel>{label}</ControlLabel> : null}
      <FormControl
        {...otherListeners}
        {...rest}
        onChange={event => onChange({ ...value, [editLocale]: event.target.value })}
        placeholder={label}
        value={valueInLocale}
      />
      {touched && error ? <HelpBlock>{error}</HelpBlock> : null}
    </FormGroup>
  );
};

export default MultilingualTextFieldAdapter;