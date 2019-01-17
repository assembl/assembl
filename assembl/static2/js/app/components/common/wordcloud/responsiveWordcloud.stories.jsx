// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { action } from '@storybook/addon-actions';
import { array, number, text, withKnobs } from '@storybook/addon-knobs';
/* eslint-enable */

import ResponsiveWordcloud from './responsiveWordcloud';

export const defaultResponsiveWordcloudProps = {
  keywords: [{ text: 'text', relevance: 0.9, count: 5 }]
};

const playground = {
  keywordsAngle: 20,
  keywordsColor: '200, 40, 180',
  keywords: [{ text: 'word1', relevance: 0.7, count: 3 }, { text: 'word2', relevance: 0.9, count: 5 }],
  numberOfKeywordsToDisplay: 30,
  onWordClick: () => {
    action('word clicked');
  }
};

storiesOf('ResponsiveWordcloud', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <ResponsiveWordcloud keywords={defaultResponsiveWordcloudProps.keywords} />))
  .add(
    'playground',
    withInfo()(() => (
      <ResponsiveWordcloud
        keywordsAngle={number('keywordsAngle', playground.keywordsAngle)}
        keywordsColor={text('keywordsColor', playground.keywordsColor)}
        keywords={array('keywords', playground.keywords)}
        numberOfKeywordsToDisplay={number('numberOfKeywordsToDisplay', playground.numberOfKeywordsToDisplay)}
        onWordClick={playground.onWordClick}
      />
    ))
  );