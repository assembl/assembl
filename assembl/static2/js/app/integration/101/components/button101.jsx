// @flow
import React from 'react';
import { Button } from 'react-bootstrap';

type Props = {
  buttonLabel: String, // Possible values: any strings
  buttonType: String, // Possible types: 'info', 'danger'
  buttonTappedHandler: Function
};

const button101 = ({
  buttonLabel,
  buttonType,
  buttonTappedHandler
}: Props) => (
  <Button
    bsStyle={buttonType}
    bsSize="large"
    className="integration"
    onClick={buttonTappedHandler}
  >
    {buttonLabel}
  </Button>
);

button101.defaultProps = {
  buttonLabel: 'Bluenove',
  buttonType: 'info'
};

export default button101;