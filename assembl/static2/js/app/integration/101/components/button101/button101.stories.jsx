// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, boolean, select } from '@storybook/addon-knobs';
/* eslint-enable */

import Button101 from './button101';

const dangerButton = {
  label: 'Custom label',
  type: 'danger'
};

const disabledButton = {
  isDisabled: true
};

const playgroundButton = {
  label: 'Playground label',
  type: ['info', 'danger'],
  isDisabled: false
};

const actions = {
  onClickHandler: action('onClickHandler')
};

storiesOf('Button101', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <Button101 onClickHandler={actions.onClickHandler} />))
  .add('disabled', withInfo()(() => <Button101 isDisabled={disabledButton.isDisabled} onClickHandler={actions.onClickHandler} />))
  .add(
    'danger',
    withInfo()(() => <Button101 label={dangerButton.label} type={dangerButton.type} onClickHandler={actions.onClickHandler} />)
  )
  .add(
    'playground',
    withInfo()(() => (
      <Button101
        label={text('label', playgroundButton.label)}
        type={select('type', playgroundButton.type)}
        isDisabled={boolean('isDisabled', playgroundButton.isDisabled)}
        onClickHandler={actions.onClickHandler}
      />
    ))
  );