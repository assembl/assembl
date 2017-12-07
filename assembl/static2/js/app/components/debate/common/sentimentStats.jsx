import React from 'react';
import { Popover } from 'react-bootstrap';
import Gauge from '../../svg/gauge';
import sentimentDefinitions from './sentimentDefinitions';

const getSentimentDetails = (totalSentimentsCount, sentimentCounts, mySentiment) => (
  <Popover id="sentiment-count-popover" className="sentiments-popover">
    {sentimentDefinitions.map((sentiment) => {
      const rectCounts = Math.round(sentimentCounts[sentiment.camelType] * 10 / totalSentimentsCount);
      return (
        <div className="gauge" key={sentiment.type}>
          <div>
            <div className={sentiment.type === mySentiment ? 'sentiment sentiment-active' : 'sentiment'}>
              <sentiment.SvgComponent size={20} />
            </div>
            <div>
              <div className="gauge-count" style={{ color: sentiment.color }}>
                {sentimentCounts[sentiment.camelType]}
              </div>
            </div>
            <div>
              <Gauge rectCounts={rectCounts} color={sentiment.color} />
            </div>
          </div>
        </div>
      );
    })}
  </Popover>
);

export default getSentimentDetails;