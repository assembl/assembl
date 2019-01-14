// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
/* eslint-enable */

import Description from './description';

storiesOf('Description', module)
  .addDecorator(withKnobs)
  .add(
    'default',
    withInfo()(() => (
      <Description>
        <p>Description content</p>
      </Description>
    ))
  );