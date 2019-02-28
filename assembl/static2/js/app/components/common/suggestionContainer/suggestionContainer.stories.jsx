// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withKnobs, object } from '@storybook/addon-knobs';
/* eslint-enable */

import SuggestionContainer from './suggestionContainer';
import type { Props as suggestionContainerProps } from './suggestionContainer';

export const defaultProps: suggestionContainerProps = {
  suggestionList: ['Investissement', 'Mesures', 'Inclusive', 'Application', 'Faisabilité']
};

const playground: suggestionContainerProps = {
  ...defaultProps
};

storiesOf('Tag On Post|SuggestionContainer', module)
  .addDecorator(withKnobs)
  .add('default', () => <SuggestionContainer {...defaultProps} />)
  .add('playground', () => <SuggestionContainer suggestionList={object('List of suggestions', playground.suggestionList)} />);