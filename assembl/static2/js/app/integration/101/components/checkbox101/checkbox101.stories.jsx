// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
/* eslint-enable */

import Checkbox101 from './checkbox101';

storiesOf('Checkbox101', module)
  .add('default', () => (
    <Checkbox101 />
  ))
  .add('checked', () => (
    <Checkbox101 checked />
  ));