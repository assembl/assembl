// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
/* eslint-enable */

import Checkbox101 from './checkbox101';

const onChangeHandler = action('onChangeHandler');

storiesOf('Checkbox101', module)
  .add('default', () => (
    <Checkbox101
      onChangeHandler={onChangeHandler}
    />
  ))
  .add('custom label', () => (
    <Checkbox101
      label="Custom Label"
      onChangeHandler={onChangeHandler}
    />
  ));