// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
/* eslint-enable */

import SuggestionContainer from './suggestionContainer';

storiesOf('Tag On Post|SuggestionContainer', module)
  .addDecorator(withInfo)
  .add('default', () => <SuggestionContainer />);