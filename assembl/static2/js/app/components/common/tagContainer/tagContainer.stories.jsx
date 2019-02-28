// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
/* eslint-enable */

import TagContainer from './tagContainer';

storiesOf('Tag On Post|TagContainer', module)
  .addDecorator(withInfo)
  .add('default', () => <TagContainer />);