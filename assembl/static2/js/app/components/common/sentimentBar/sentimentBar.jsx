// @flow
import React from 'react';

// Helpers imports
import { getIconPath } from '../../../utils/globalFunctions';

export type Props = {
  /**  Value between 0 and 1 */
  value: number
};

const SentimentBar = ({ value }: Props) => {
  let level = 0.5;
  if (value < 0.35) {
    level = 0;
  } else if (value < 0.5) {
    level = 1;
  } else if (value < 0.65) {
    level = 2;
  } else {
    level = 3;
  }
  return (
    <div className="sentimentBar">
      <img alt="Sentiment bar" src={getIconPath(`img-sentimentBar-${level}.svg`)} />
      <p className={`level-${level}`}>{value.toFixed(2)}</p>
    </div>
  );
};

export default SentimentBar;