// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, boolean } from '@storybook/addon-knobs';
/* eslint-enable */

import Checkbox101 from './checkbox101';

const playgroundButton = {
  label: 'Playground label',
  isDone: true
};

const actions = {
  onChangeHandler: action('onChangeHandler')
};

storiesOf('Checkbox101', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => (
    <Checkbox101
      onChangeHandler={actions.onChangeHandler}
    />
  )))
  .add('checked', withInfo()(() => (
    <Checkbox101
      isDone
      onChangeHandler={actions.onChangeHandler}
    />
  )))
  .add('custom label', withInfo()(() => (
    <Checkbox101
      label="Custom Label"
      onChangeHandler={actions.onChangeHandler}
    />
  )))
  .add('playground', withInfo()(() => (
    <Checkbox101
      label={text('label', playgroundButton.label)}
      isDone={boolean('isDone', playgroundButton.isDone)}
      onChangeHandler={actions.onChangeHandler}
    />
  )));