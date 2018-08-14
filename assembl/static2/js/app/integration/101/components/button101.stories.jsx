// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
/* eslint-enable */

import Button101 from './button101';

export const dangerButtonWithCustomLabel = {
  buttonLabel: 'Custom label',
  buttonType: 'danger'
};

export const disabledButton = {
  buttonIsDisabled: true
};

export const actions = {
  defaultButtonTappedHandler: action('defaultButtonTappedHandlers'),
  dangerButtonTappedHandler: action('dangerButtonTappedHandler')
};

storiesOf('Button101', module)
  .add('default', () => (
    <Button101
      buttonTappedHandler={actions.defaultButtonTappedHandler}
    />
  ))
  .add('disabled', () => (
    <Button101
      buttonIsDisabled={disabledButton.buttonIsDisabled}
      buttonTappedHandler={actions.defaultButtonTappedHandler}
    />
  ))
  .add('danger', () => (
    <Button101
      buttonLabel={dangerButtonWithCustomLabel.buttonLabel}
      buttonType={dangerButtonWithCustomLabel.buttonType}
      buttonTappedHandler={actions.dangerButtonTappedHandler}
    />
  ));