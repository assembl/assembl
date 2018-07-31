// @flow
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { Checkbox, FormGroup, HelpBlock } from 'react-bootstrap';

import { getValidationState } from './utils';

type Props = {
  label: string
} & FieldRenderProps;

const CheckboxFieldAdapter = ({ input, label, meta: { error, touched } }: Props) => (
  <FormGroup controlId={input.name} validationState={getValidationState(error, touched)}>
    <Checkbox {...input}>{label}</Checkbox>
    {touched && error ? <HelpBlock>{error}</HelpBlock> : null}
  </FormGroup>
);

export default CheckboxFieldAdapter;