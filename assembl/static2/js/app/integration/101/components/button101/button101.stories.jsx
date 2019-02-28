// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, select } from '@storybook/addon-knobs';
/* eslint-enable */

import Button101 from './button101';
import type { Button101Type } from './button101';

const actions: { [name: string]: Function } = {
  onClickHandler: action('onClickHandler')
};

const defaultButton: Button101Type = {
  isDisabled: false,
  type: 'info',
  label: 'Custom label',
  onClickHandler: actions.onClickHandler
};

const disabledButton: Button101Type = {
  ...defaultButton,
  isDisabled: true
};

const dangerButton: Button101Type = {
  ...defaultButton,
  type: 'danger'
};

const playground: Object = {
  label: 'Playground label',
  type: ['info', 'danger'],
  isDisabled: false
};

storiesOf('Button101', module)
  .addDecorator(withKnobs)
  .add('default', () => <Button101 {...defaultButton} />)
  .add('disabled', () => <Button101 {...disabledButton} />)
  .add('danger', () => <Button101 {...dangerButton} />)
  .add('playground', () => (
    <Button101
      label={text('label', playground.label)}
      type={select('type', playground.type, playground.type[0])}
      isDisabled={boolean('isDisabled', playground.isDisabled)}
      onClickHandler={actions.onClickHandler}
    />
  ));