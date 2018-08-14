import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
/* eslint-enable */

import Button101 from './button101';

const dangerButtonWithCustomLabel = {
  buttonLabel: 'Custom label',
  buttonType: 'danger'
};

const actions = {
  defaultButtonTappedHandler: action('defaultButtonTappedHandlers'),
  dangerButtonTappedHandler: action('dangerButtonTappedHandler')
};

storiesOf('Button101', module)
  .add('default', () => <Button101 />)
  .add('danger', () => (
    <Button101
      buttonLabel={dangerButtonWithCustomLabel.buttonLabel}
      buttonType={dangerButtonWithCustomLabel.buttonType}
    />
  ))
  .add('default with action', () => (
    <Button101
      buttonTappedHandler={actions.defaultButtonTappedHandler}
    />
  ))
  .add('danger with action', () => (
    <Button101
      buttonLabel={dangerButtonWithCustomLabel.buttonLabel}
      buttonType={dangerButtonWithCustomLabel.buttonType}
      buttonTappedHandler={actions.dangerButtonTappedHandler}
    />
  ));