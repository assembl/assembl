// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, number } from '@storybook/addon-knobs';
/* eslint-enable */

import ResultInformation from './resultInformation';
import type { Props as ResultInformationProps } from './resultInformation';

export const defaultResultInformationProps: ResultInformationProps = {
  wordsCount: 50
};

const playground = {
  wordsCount: 120
};

storiesOf('ResultInformation', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <ResultInformation {...defaultResultInformationProps} />))
  .add('playground', withInfo()(() => <ResultInformation wordsCount={number('words count', playground.wordsCount)} />));