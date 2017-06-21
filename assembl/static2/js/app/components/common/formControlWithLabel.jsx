/*
  FormGroup that contains a FormControl for which:
    - if there is a value, displays a label
    - if there is no value, put the label in the placeholder
 */
import React from 'react';
import { FormGroup, FormControl } from 'react-bootstrap';

const FormControlWithLabel = ({ componentClass, id, label, onChange, type, value }) => {
  return (
    <FormGroup>
      {value ? <label htmlFor={id}>{label}</label> : null}
      <FormControl componentClass={componentClass} id={id} type={type} placeholder={label} onChange={onChange} value={value} />
    </FormGroup>
  );
};

FormControlWithLabel.defaultProps = {
  type: 'text',
  value: ''
};

export default FormControlWithLabel;