/*
  FormGroup that contains a FormControl for which:
    - if there is a value, displays a label
    - if there is no value, put the label in the placeholder
 */
import React from 'react';
import { ControlLabel, FormGroup, FormControl } from 'react-bootstrap';

const FormControlWithLabel = ({ componentClass, id, label, onChange, type, value }) => {
  return (
    <FormGroup>
      {value ? <ControlLabel htmlFor={id}>{label}</ControlLabel> : null}
      <FormControl componentClass={componentClass} id={id} type={type} placeholder={label} onChange={onChange} value={value} />
    </FormGroup>
  );
};

FormControlWithLabel.defaultProps = {
  type: 'text',
  value: ''
};

export default FormControlWithLabel;