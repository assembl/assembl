// @flow
import React from 'react';
import { Button } from 'react-bootstrap';

type Props = {
  buttonLabel?: string, // Optional possible values: any strings
  buttonType?: string, // Optional possible types: 'info', 'danger'
  buttonTappedHandler: Function, // Required onClick function
  buttonIsDisabled?: boolean // Optional flag to enable the button
};

const button101 = ({
  buttonLabel,
  buttonType,
  buttonTappedHandler,
  buttonIsDisabled
}: Props) => (
  <Button
    bsStyle={buttonType}
    bsSize="large"
    className="integration button"
    onClick={buttonTappedHandler}
    disabled={buttonIsDisabled}
  >
    {buttonLabel}
  </Button>
);

button101.defaultProps = {
  buttonLabel: 'Bluenove',
  buttonType: 'info',
  buttonIsDisabled: false
};

export default button101;