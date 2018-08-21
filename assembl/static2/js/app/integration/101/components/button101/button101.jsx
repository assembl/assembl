// @flow
import React from 'react';
import { Button } from 'react-bootstrap';

type Props = {
  /** Optional possible values: any strings */
  label?: string,
  /** Optional possible types: 'info', 'danger' */
  type?: 'info' | 'danger',
  /** Optional flag to enable the button */
  isDisabled?: boolean,
  /** Required onClick function */
  onClickHandler: Function
};

const button101 = ({
  label,
  type,
  isDisabled,
  onClickHandler
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