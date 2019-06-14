// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { number, object, withKnobs } from '@storybook/addon-knobs';
/* eslint-enable */

import WordCloudForIE from './wordCloudForIE';

export const defaultWordCloudForIEProps = {
  keywords: [{ count: 5, score: 0.9, value: 'text five' }, { count: 3, score: 0.6, value: 'text three' }],
  numberOfKeywordsToDisplay: 2,
  onKeywordClick: action('onKeywordClick')
};

const playground = {
  ...defaultWordCloudForIEProps
};

storiesOf('Semantic Analysis|WordCloudForIE', module)
  .addDecorator(withKnobs)
  .add('default', () => <WordCloudForIE {...defaultWordCloudForIEProps} />)
  .add('playground', () => (
    <WordCloudForIE
      keywords={object('keywords', playground.keywords)}
      numberOfKeywordsToDisplay={number('keywords to display', playground.numberOfKeywordsToDisplay)}
      onKeywordClick={playground.onKeywordClick}
    />
  ));