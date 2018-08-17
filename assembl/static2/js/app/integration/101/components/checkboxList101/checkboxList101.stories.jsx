// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
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

const onChangeHandler = action('onChangeHandler');

storiesOf('CheckboxList101', module)
  .add('List of 5', withInfo()(() => (
    <CheckboxList101
      checkboxes={listOfcheckboxes}
      onChangeHandler={onChangeHandler}
    />
  )))
  .add('Empty list', withInfo()(() => (
    <CheckboxList101
      checkboxes={listOfNone}
      onChangeHandler={onChangeHandler}
    />
  )));