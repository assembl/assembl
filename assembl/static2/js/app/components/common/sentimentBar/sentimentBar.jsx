// @flow
import * as React from 'react';

// Helpers imports
import { I18n } from 'react-redux-i18n';
import SentimentBarIcon from '../icons/sentimentBarIcon/sentimentBarIcon';

export type Props = {
  /** Value between 0 and 1 */
  value: number
};

type LevelProps = {
  error: number,
  veryBad: number,
  bad: number,
  good: number,
  excellent: number
};

type LevelMinValueProps = {
  veryBad: number,
  bad: number,
  good: number,
  excellent: number,
  maxLimit: number
};

const LEVEL: LevelProps = {
  error: -1,
  veryBad: 0,
  bad: 1,
  good: 2,
  excellent: 3
};

const LEVEL_MIN_VALUE: LevelMinValueProps = {
  veryBad: 0,
  bad: 0.35,
  good: 0.5,
  excellent: 0.65,
  maxLimit: 1
};

const SentimentBar = ({ value }: Props) => {
  let level = LEVEL.error;
  if (value >= LEVEL_MIN_VALUE.veryBad && value <= LEVEL_MIN_VALUE.maxLimit) {
    if (value < LEVEL_MIN_VALUE.bad) {
      level = LEVEL.veryBad;
    } else if (value < LEVEL_MIN_VALUE.good) {
      level = LEVEL.bad;
    } else if (value < LEVEL_MIN_VALUE.excellent) {
      level = LEVEL.good;
    } else {
      level = LEVEL.excellent;
    }
  }

  const errorKey = 'common.loader.error';
  const errorText: string = I18n.t(errorKey);

  return level === -1 ? (
    <div className="sentimentBar">
      <p className="error">{errorText}</p>
    </div>
  ) : (
    <div className="sentimentBar">
      <SentimentBarIcon level={level} />
      <p className={`level-${level}`}>{value.toFixed(2)}</p>
    </div>
  );
};

export default SentimentBar;