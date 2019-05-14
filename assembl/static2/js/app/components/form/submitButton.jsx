// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import classNames from 'classnames';

type Props = {
  disabled?: boolean,
  label: string,
  name?: string,
  onClick: () => void
};

const SubmitButton = ({ disabled, label, name, onClick }: Props) => {
  const buttonClasses = classNames('save-button button-submit', {
    'button-dark': !disabled
  });

  return (
    <Button name={name} type="submit" className={buttonClasses} disabled={disabled} onClick={onClick}>
      <Translate value={label} />
    </Button>
  );
};

SubmitButton.defaultProps = {
  disabled: false,
  name: 'save'
};

export default SubmitButton;