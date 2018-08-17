// @flow
import React from 'react';
import { Button } from 'react-bootstrap';

type Props = {
  label?: string, // Optional possible values: any strings
  type?: string, // Optional possible types: 'info', 'danger'
  onClickHandler: Function, // Required onClick function
  isDisabled?: boolean // Optional flag to enable the button
};

const button101 = ({
  label,
  type,
  onClickHandler,
  isDisabled
}: Props) => (
  <Button
    bsStyle={type}
    bsSize="large"
    className="integration button"
    onClick={onClickHandler}
    disabled={isDisabled}
  >
    {label}
  </Button>
);

button101.defaultProps = {
  label: 'Bluenove',
  type: 'info',
  isDisabled: false
};

export default button101;