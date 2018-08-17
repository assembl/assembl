// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
/* eslint-enable */

import Checkbox101 from './checkbox101';

const onChangeHandler = action('onChangeHandler');

storiesOf('Checkbox101', module)
  .add('default', withInfo()(() => (
    <Checkbox101
      onChangeHandler={onChangeHandler}
    />
  )))
  .add('checked', withInfo()(() => (
    <Checkbox101
      isDone
      onChangeHandler={onChangeHandler}
    />
  )))
  .add('custom label', withInfo()(() => (
    <Checkbox101
      label="Custom Label"
      onChangeHandler={onChangeHandler}
    />
  )));