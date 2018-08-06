// @flow
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { Checkbox, FormGroup } from 'react-bootstrap';

import Error from './error';
import { getValidationState } from './utils';

type Props = {
  label: string
} & FieldRenderProps;

const CheckboxFieldAdapter = ({ input, label, meta: { error, touched } }: Props) => (
  <FormGroup controlId={input.name} validationState={getValidationState(error, touched)}>
    <Checkbox {...input}>{label}</Checkbox>
    <Error name={input.name} />
  </FormGroup>
);

export default CheckboxFieldAdapter;