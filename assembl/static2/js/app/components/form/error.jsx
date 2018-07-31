// @flow
import React from 'react';
import { HelpBlock } from 'react-bootstrap';
import { Field } from 'react-final-form';

type Props = {
  name: string
};

const Error = ({ name }: Props) => (
  <Field
    name={name}
    subscription={{ touched: true, error: true }}
    render={({ meta: { touched, error } }) => (touched && error ? <HelpBlock>{error}</HelpBlock> : null)}
  />
);

export default Error;