// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
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
  .add('default', withInfo()(() => <KeywordInfo {...defaultKeywordInfoProps} />))
  .add('playground', withInfo()(() => <KeywordInfo keyword={object('keyword', playground.keyword)} />));