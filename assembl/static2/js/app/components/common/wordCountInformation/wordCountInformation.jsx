// @flow
import * as React from 'react';
import { I18n, Translate } from 'react-redux-i18n';

import Description from '../description/description';

export type Props = {
  /** Number of words analysed by Watson */
  wordsCount: number
};

const WordCountInformation = ({ wordsCount }: Props) => {
  const words = `${I18n.t('common.wordCountInformation.words', { wordsCount: wordsCount })}`;
  const information = <Translate value="common.wordCountInformation.msg" words={words} dangerousHTML />;

  return <Description>{information}</Description>;
};

export default WordCountInformation;