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
    text: 'test',
    count: 5,
    relevance: 0.85
  }
};

const playground = {
  keyword: {
    text: 'test',
    count: 5,
    relevance: 0.85
  }
};

storiesOf('KeywordInfo', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <KeywordInfo {...defaultKeywordInfoProps} />))
  .add('playground', withInfo()(() => <KeywordInfo keyword={object('keyword', playground.keyword)} />));