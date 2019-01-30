// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { action } from '@storybook/addon-actions';
import { array, number, text, withKnobs } from '@storybook/addon-knobs';
/* eslint-enable */

import ResponsiveWordCloud from './responsiveWordCloud';

export const defaultResponsiveWordCloudProps = {
  keywords: [{ count: 5, score: 0.9, value: 'text' }]
};

const playground = {
  keywordsAngle: 20,
  keywordsColor: '#192882',
  keywordsColorActive: '#0af',
  keywords: [{ count: 3, score: 0.7, value: 'word1' }, { count: 5, score: 0.9, value: 'word2' }],
  numberOfKeywordsToDisplay: 30,
  onWordClick: () => {
    action('word clicked');
  }
};

storiesOf('ResponsiveWordCloud', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <ResponsiveWordCloud keywords={defaultResponsiveWordCloudProps.keywords} />))
  .add(
    'playground',
    withInfo()(() => (
      <ResponsiveWordCloud
        keywordsAngle={number('keywordsAngle', playground.keywordsAngle)}
        keywordsColor={text('keywordsColor', playground.keywordsColor)}
        keywordsColorActive={text('keywordsColorActive', playground.keywordsColorActive)}
        keywords={array('keywords', playground.keywords)}
        numberOfKeywordsToDisplay={number('numberOfKeywordsToDisplay', playground.numberOfKeywordsToDisplay)}
        onWordClick={playground.onWordClick}
      />
    ))
  );