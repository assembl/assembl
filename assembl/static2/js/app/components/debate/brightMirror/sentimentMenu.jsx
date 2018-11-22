// @flow
import React from 'react';
import get from 'lodash/get';

import { OverlayTrigger } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

import { MEDIUM_SCREEN_WIDTH, SENTIMENT_TOP_OFFSET, SENTIMENT_RIGHT_OFFSET } from '../../../constants';
import Sentiments from '../common/sentiments';
import getSentimentStats from '../common/sentimentStats';
import fictionSentimentDefinitions from './fictionSentimentDefinition';

export type Props = {
  position: { x: number, y: number },
  postId: string,
  sentimentCounts: ?SentimentCountsFragment,
  mySentiment: ?string,
  screenWidth: number,
  refetchPost: Function,
  isPhaseCompleted: boolean
};

const SentimentMenu = ({ postId, mySentiment, screenWidth, refetchPost, position, sentimentCounts, isPhaseCompleted }: Props) => {
  let count = 0;
  let totalSentimentsCount = 0;
  if (sentimentCounts) {
    const { like, disagree, dontUnderstand, moreInfo } = sentimentCounts;
    totalSentimentsCount = like + disagree + dontUnderstand + moreInfo;
  }
  return (
    <div
      className="sentiment-container hidden-xs hidden-sm hidden-md"
      style={{
        top: `${position ? position.y + SENTIMENT_TOP_OFFSET : 0}px`,
        left: `${position ? position.x / 2 - SENTIMENT_RIGHT_OFFSET : 0}px`
      }}
    >
      <Sentiments
        sentimentCounts={sentimentCounts}
        mySentiment={mySentiment}
        placement="right"
        postId={postId}
        isPhaseCompleted={isPhaseCompleted}
        onCompleted={refetchPost}
        customSentimentDefinitions={fictionSentimentDefinitions}
      />
      {totalSentimentsCount > 0 ? (
        <OverlayTrigger overlay={getSentimentStats(totalSentimentsCount, sentimentCounts, mySentiment)} placement="right">
          <div className="sentiments-count margin-m">
            <div>
              {fictionSentimentDefinitions.reduce((result, sentiment) => {
                const sentimentCount = get(sentimentCounts, sentiment.camelType, 0);
                if (sentimentCount > 0) {
                  result.push(
                    <div className="min-sentiment" key={sentiment.type} style={{ left: `${count * 6}px` }}>
                      <sentiment.SvgComponent size={15} />
                    </div>
                  );
                  count += 1;
                }
                return result;
              }, [])}
            </div>
            <div className="txt" style={{ paddingLeft: `${(count + 2) * 6}px` }}>
              {screenWidth >= MEDIUM_SCREEN_WIDTH ? (
                totalSentimentsCount
              ) : (
                <Translate value="debate.thread.numberOfReactions" count={totalSentimentsCount} />
              )}
            </div>
          </div>
        </OverlayTrigger>
      ) : (
        <div className="empty-sentiments-count" />
      )}
    </div>
  );
};

export default SentimentMenu;