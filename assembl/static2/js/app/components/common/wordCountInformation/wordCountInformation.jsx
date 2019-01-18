// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';

import Description from '../description/description';

export type Props = {
  /** Number of words analysed by Watson */
  wordCount: number
};

const WordCountInformation = ({ wordCount }: Props) => {
  const words = `${I18n.t('common.wordCountInformation.words', { wordCount: wordCount })}`;
  const information = <Translate value="common.wordCountInformation.msg" words={words} dangerousHTML />;
  // dangerousHTML is used here in order to pass HTML tag as params

  return <Description>{information}</Description>;
};

export default WordCountInformation;