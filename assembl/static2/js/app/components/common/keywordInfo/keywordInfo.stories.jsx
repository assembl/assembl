// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { color, withKnobs, object } from '@storybook/addon-knobs';
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
  color: '#000',
  keyword: {
    text: 'test',
    count: 5,
    relevance: 0.85
  }
};

storiesOf('KeywordInfo', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <KeywordInfo {...defaultKeywordInfoProps} />))
  .add(
    'playground',
    withInfo()(() => <KeywordInfo color={color('color', playground.color)} keyword={object('keyword', playground.keyword)} />)
  );