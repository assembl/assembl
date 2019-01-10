// @flow
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { Checkbox, FormGroup } from 'react-bootstrap';

import Error from './error';
import { getValidationState } from './utils';

type Props = {
  isChecked: boolean,
  label: string
} & FieldRenderProps;

const CheckboxFieldAdapter = ({ input, label, isChecked, meta: { error, touched } }: Props) => {
  const localePreference =
    input.value === ''
      ? {
        ...input,
        value: isChecked,
        checked: isChecked
      }
      : { ...input };
  return (
    <FormGroup controlId={input.name} validationState={getValidationState(error, touched)}>
      <Checkbox {...localePreference}>{label}</Checkbox>
      <Error name={input.name} />
    </FormGroup>
  );
};

export default CheckboxFieldAdapter;