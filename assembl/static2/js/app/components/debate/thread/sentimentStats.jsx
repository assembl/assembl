import React from 'react';
import { Popover } from 'react-bootstrap';
import Gauge from '../../svg/gauge';
import like from '../../svg/like';
import disagree from '../../svg/disagree';
import dontUnderstand from '../../svg/dontUnderstand';
import moreInfo from '../../svg/moreInfo';

const getGaugeParams = (type) => {
  switch (type) {
  case 'like':
    return { color: '#46D081', svg: like };
  case 'disagree':
    return { color: '#F2474D', svg: disagree };
  case 'dontUnderstand':
    return { color: '#FAC16F', svg: dontUnderstand };
  case 'moreInfo':
    return { color: '#9374FF', svg: moreInfo };
  default:
    return { color: '#46D081', svg: 'like' };
  }
};

const getSentimentDetails = (totalSentimentsCount, sentimentCounts) => {
  const sentimentStats = (
    <Popover id="sentiments-popover">
      {Object.keys(sentimentCounts).map((type, index) => {
        const params = getGaugeParams(type, sentimentCounts[type], totalSentimentsCount);
        const rectCounts = Math.round(sentimentCounts[type] * 10 / totalSentimentsCount);
        if (type !== '__typename') {
          return (
            <div className="gauge" key={index}>
              <div>
                <div>
                  <params.svg size={20} />
                </div>
                <div>
                  <div className="gauge-count" style={{ color: params.color }}>{sentimentCounts[type]}</div>
                </div>
                <div>
                  <Gauge rectCounts={rectCounts} color={params.color} />
                </div>
              </div>
            </div>
          );
        }
        return <div />;
      })}
    </Popover>
  );
  return sentimentStats;
};

export default getSentimentDetails;