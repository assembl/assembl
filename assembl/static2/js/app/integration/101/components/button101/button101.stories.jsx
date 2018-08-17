// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
/* eslint-enable */

import Button101 from './button101';

const dangerButtonWithCustomLabel = {
  label: 'Custom label',
  type: 'danger'
};

const disabledButton = {
  isDisabled: true
};

const actions = {
  onClickHandler: action('onClickHandler')
};

storiesOf('Button101', module)
  .add('default', () => (
    <Button101
      onClickHandler={actions.onClickHandler}
    />
  ))
  .add('disabled', () => (
    <Button101
      isDisabled={disabledButton.isDisabled}
      onClickHandler={actions.onClickHandler}
    />
  ))
  .add('danger', () => (
    <Button101
      label={dangerButtonWithCustomLabel.label}
      type={dangerButtonWithCustomLabel.type}
      onClickHandler={actions.onClickHandler}
    />
  ));