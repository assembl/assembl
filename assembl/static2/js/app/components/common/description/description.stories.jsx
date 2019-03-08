// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
/* eslint-enable */

import Description from './description';

storiesOf('Semantic Analysis|Description', module)
  .addDecorator(withKnobs)
  .add('default', () => (
    <Description>
      <p>Description content</p>
    </Description>
  ));