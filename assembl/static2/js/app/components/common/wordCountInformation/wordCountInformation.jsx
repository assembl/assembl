// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import classNames from 'classnames';

import Description from '../description/description';

export type Props = {
  /** Number of words analysed by Watson */
  wordCount: number,
  /** Optional added classes */
  className: ?string
};

const WordCountInformation = ({ wordCount, className }: Props) => {
  const words = `${I18n.t('common.wordCountInformation.words', { wordCount: wordCount })}`;
  const information = <Translate value="common.wordCountInformation.msg" words={words} dangerousHTML />;
  // dangerousHTML is used here in order to pass HTML tag as params

  return <Description className={classNames(className)}>{information}</Description>;
};

WordCountInformation.defaultProps = {
  className: null
};

export default WordCountInformation;