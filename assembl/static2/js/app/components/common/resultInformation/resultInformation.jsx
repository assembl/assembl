// @flow
import * as React from 'react';
import { I18n, Translate } from 'react-redux-i18n';

import Description from '../description/description';

export type Props = {
  /** Number of words analysed by Watson */
  wordsNumber: number
};

const ResultInformation = ({ wordsNumber }: Props) => {
  const numberWords = `${I18n.t('common.resultInformation.numberWords', { numberWords: wordsNumber })}`;

  return (
    <Description>
      <Translate value="common.resultInformation.msg" words={numberWords} dangerousHTML />
    </Description>
  );
};

export default ResultInformation;