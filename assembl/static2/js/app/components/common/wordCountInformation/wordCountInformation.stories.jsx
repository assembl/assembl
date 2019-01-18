// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, number } from '@storybook/addon-knobs';
/* eslint-enable */

import WordCountInformation from './wordCountInformation';
import type { Props as WordCountInformationProps } from './wordCountInformation';

export const defaultWordCountInformationProps: WordCountInformationProps = {
  wordsCount: 50
};

const playground = {
  wordsCount: 120
};

storiesOf('WordCountInformation', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <WordCountInformation {...defaultWordCountInformationProps} />))
  .add('playground', withInfo()(() => <WordCountInformation wordsCount={number('words count', playground.wordsCount)} />));