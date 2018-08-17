// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
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
  .add('default', withInfo()(() => (
    <Button101
      onClickHandler={actions.onClickHandler}
    />
  )))
  .add('disabled', withInfo()(() => (
    <Button101
      isDisabled={disabledButton.isDisabled}
      onClickHandler={actions.onClickHandler}
    />
  )))
  .add('danger', withInfo()(() => (
    <Button101
      label={dangerButtonWithCustomLabel.label}
      type={dangerButtonWithCustomLabel.type}
      onClickHandler={actions.onClickHandler}
    />
  )));