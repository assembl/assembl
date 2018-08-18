// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, object } from '@storybook/addon-knobs';
/* eslint-enable */

import CheckboxList101 from './checkboxList101';

const listOfNone = [];

const listOfcheckboxes = [
  { label: 'AAA', isDone: false },
  { label: 'BBB', isDone: false },
  { label: 'CCC', isDone: true },
  { label: 'DDD', isDone: false },
  { label: 'EEE', isDone: false }
];

const actions = {
  onChangeHandler: action('onChangeHandler')
};

storiesOf('CheckboxList101', module)
  .addDecorator(withKnobs)
  .add('List of 5', withInfo()(() => (
    <CheckboxList101
      checkboxes={listOfcheckboxes}
      onChangeHandler={actions.onChangeHandler}
    />
  )))
  .add('Empty list', withInfo()(() => (
    <CheckboxList101
      checkboxes={listOfNone}
      onChangeHandler={actions.onChangeHandler}
    />
  )))
  .add('playground', withInfo()(() => (
    <CheckboxList101
      checkboxes={object('checkboxes', listOfcheckboxes)}
      onChangeHandler={actions.onChangeHandler}
    />
  )));