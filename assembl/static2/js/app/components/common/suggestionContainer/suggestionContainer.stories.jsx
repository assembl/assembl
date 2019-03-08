// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withKnobs, object, text } from '@storybook/addon-knobs';
/* eslint-enable */

// Helpers imports
import { I18n } from 'react-redux-i18n';

import SuggestionContainer from './suggestionContainer';
import type { Props as suggestionContainerProps } from './suggestionContainer';

export const defaultProps: suggestionContainerProps = {
  suggestionContainerClassnamePrefix: 'suggestion',
  suggestionContainerTitle: I18n.t('debate.tagOnPost.suggestionContainerTitle'),
  suggestionList: ['Investissement', 'Mesures', 'Inclusive', 'Application', 'Faisabilité']
};

const playground: suggestionContainerProps = {
  ...defaultProps,
  suggestionContainerTitle: 'This is a custom title'
};

storiesOf('Tag On Post|SuggestionContainer', module)
  .addDecorator(withKnobs)
  .add('default', () => <SuggestionContainer {...defaultProps} />)
  .add('playground', () => (
    <SuggestionContainer
      suggestionContainerClassnamePrefix={text('Classname prefix', playground.suggestionContainerClassnamePrefix)}
      suggestionContainerTitle={text('Container title', playground.suggestionContainerTitle)}
      suggestionList={object('List of suggestions', playground.suggestionList)}
    />
  ));