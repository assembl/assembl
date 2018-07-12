// @flow
import React from 'react';
import { type FieldRenderProps } from 'react-final-form';
import { Checkbox, FormGroup, HelpBlock } from 'react-bootstrap';

type Props = {
  label: string
} & FieldRenderProps;

const CheckboxFieldAdapter = ({ input, label, meta: { error, touched } }: Props) => (
  <FormGroup controlId={input.name}>
    <Checkbox {...input}>{label}</Checkbox>
    {touched && error ? <HelpBlock>{error}</HelpBlock> : null}
  </FormGroup>
);

export default CheckboxFieldAdapter;