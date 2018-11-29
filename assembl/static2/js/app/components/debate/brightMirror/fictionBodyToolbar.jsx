// @flow
import React from 'react';
import get from 'lodash/get';
import { OverlayTrigger } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
// Constant imports
import { MEDIUM_SCREEN_WIDTH, SENTIMENT_TOP_OFFSET, SENTIMENT_RIGHT_OFFSET } from '../../../constants';
import { commentHelperButtonTooltip } from '../../common/tooltips';
// Component imports
import Sentiments from '../common/sentiments';
import CommentHelperButton from '../common/commentHelperButton';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
// Helper imports
import getSentimentStats from '../common/sentimentStats';
import fictionSentimentDefinitions from './fictionSentimentDefinition';
import { displayModal } from '../../../utils/utilityManager';
// Type imports
import type { Props as CommentHelperButtonProps } from '../common/commentHelperButton';

export type Props = {
  position: { x: number, y: number },
  postId: string,
  sentimentCounts: ?SentimentCountsFragment,
  mySentiment: ?string,
  screenWidth: number,
  isPhaseCompleted: boolean
};

const FictionBodyToolbar = ({ postId, mySentiment, screenWidth, position, sentimentCounts, isPhaseCompleted }: Props) => {
  let count = 0;
  let totalSentimentsCount = 0;
  if (sentimentCounts) {
    const { like, disagree, dontUnderstand, moreInfo } = sentimentCounts;
    totalSentimentsCount = like + disagree + dontUnderstand + moreInfo;
  }

  const modalTitle = 'Hello World';
  const modalBody = [
    <h1>Hello World</h1>,
    <img src="/static2/img/comment-helper.gif" alt="comment-helper.gif" />,
    <p>Hello World Hello World</p>
  ];
  const includeFooterInModal = false;

  const commentHelperButtonProps: CommentHelperButtonProps = {
    onClickCallback: () => displayModal(modalTitle, modalBody, includeFooterInModal),
    linkClassName: 'comment-helper'
  };

  const displayCommentHelperButton = (
    <ResponsiveOverlayTrigger placement="right" tooltip={commentHelperButtonTooltip}>
      <CommentHelperButton {...commentHelperButtonProps} />
    </ResponsiveOverlayTrigger>
  );

  return (
    <div
      className="body-toolbar-container hidden-xs hidden-sm hidden-md"
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
      {displayCommentHelperButton}
    </div>
  );
};

export default FictionBodyToolbar;