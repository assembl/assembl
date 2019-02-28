// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withKnobs, object } from '@storybook/addon-knobs';
/* eslint-enable */

import KeywordInfo from './keywordInfo';

export const defaultKeywordInfoProps = {
  keyword: {
    count: 5,
    score: 0.85,
    value: 'test'
  }
};

const playground = {
  ...defaultKeywordInfoProps
};

storiesOf('Semantic Analysis|KeywordInfo', module)
  .addDecorator(withKnobs)
  .add('default', () => <KeywordInfo {...defaultKeywordInfoProps} />)
  .add('playground', () => <KeywordInfo keyword={object('keyword', playground.keyword)} />);