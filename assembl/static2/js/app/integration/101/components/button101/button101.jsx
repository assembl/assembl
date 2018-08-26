// @flow
import React from 'react';
import { Button } from 'react-bootstrap';

export type Button101Type = {
  /** Button label, possible values: any strings */
  label: string,
  /** Button type, Possible types: 'info', 'danger' */
  type: 'info' | 'danger',
  /** Button flag that toggles the button */
  isDisabled: boolean,
  /** onClick function */
  onClickHandler: Function
};

const button101 = ({ label, type, isDisabled, onClickHandler }: Button101Type) => (
  <Button bsStyle={type} bsSize="large" className="integration button" onClick={onClickHandler} disabled={isDisabled}>
    {label}
  </Button>
);

export default button101;