import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';

import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import DontUnderstand from '../../svg/dontUnderstand';
import MoreInfo from '../../svg/moreInfo';

const answerTooltip = (
  <Tooltip id="answerTooltip">
    <Translate value="debate.toAnswer" />
  </Tooltip>
);

const shareTooltip = (
  <Tooltip id="shareTooltip">
    <Translate value="debate.share" />
  </Tooltip>
);

const likeTooltip = (
  <Tooltip id="likeTooltip">
    <Translate value="debate.like" />
  </Tooltip>
);

const disagreeTooltip = (
  <Tooltip id="disagreeTooltip">
    <Translate value="debate.disagree" />
  </Tooltip>
);

const dontUnderstandTooltip = (
  <Tooltip id="dontUnderstandTooltip">
    <Translate value="debate.dontUnderstand" />
  </Tooltip>
);

const moreInfoTooltip = (
  <Tooltip id="moreInfoTooltip">
    <Translate value="debate.moreInfo" />
  </Tooltip>
);

const PostActions = ({ sentimentCounts, mySentiment, handleAnswerClick, postChildren }) => {
  let count = 0;
  const totalSentimentsCount = sentimentCounts
    ? sentimentCounts.like + sentimentCounts.disagree + sentimentCounts.dontUnderstand + sentimentCounts.moreInfo
    : 0;
  return (
    <div>
      <div className="post-icons">
        <div className="post-action" onClick={handleAnswerClick}>
          <OverlayTrigger placement="right" overlay={answerTooltip}>
            <span className="assembl-icon-back-arrow color" />
          </OverlayTrigger>
        </div>
        <div className="post-action">
          <OverlayTrigger placement="right" overlay={shareTooltip}>
            <span className="assembl-icon-share color" />
          </OverlayTrigger>
        </div>
        <div className="add-sentiment">
          <OverlayTrigger placement="right" overlay={likeTooltip}>
            <div className={mySentiment === 'LIKE' ? 'sentiment sentiment-active' : 'sentiment'}>
              <Like size={25} />
            </div>
          </OverlayTrigger>
          <OverlayTrigger placement="right" overlay={disagreeTooltip}>
            <div className={mySentiment === 'DISAGREE' ? 'sentiment sentiment-active' : 'sentiment'}>
              <Disagree size={25} />
            </div>
          </OverlayTrigger>
          <OverlayTrigger placement="right" overlay={dontUnderstandTooltip}>
            <div className={mySentiment === 'DONT_UNDERSTAND' ? 'sentiment sentiment-active' : 'sentiment'}>
              <DontUnderstand size={25} />
            </div>
          </OverlayTrigger>
          <OverlayTrigger placement="right" overlay={moreInfoTooltip}>
            <div className={mySentiment === 'MORE_INFO' ? 'sentiment sentiment-active' : 'sentiment'}>
              <MoreInfo size={25} />
            </div>
          </OverlayTrigger>
        </div>
      </div>
      {totalSentimentsCount > 0 &&
        <div className="sentiments-count margin-m">
          <div>
            <div>
              {Object.keys(sentimentCounts).map((sentiment, index) => {
                if (sentimentCounts[sentiment] > 0 && sentiment === 'like') {
                  return (
                    <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                      <Like size={15} />
                    </div>
                  );
                }
                if (sentimentCounts[sentiment] > 0 && sentiment === 'disagree') {
                  return (
                    <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                      <Disagree size={15} />
                    </div>
                  );
                }
                if (sentimentCounts[sentiment] > 0 && sentiment === 'dontUnderstand') {
                  return (
                    <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                      <DontUnderstand size={15} />
                    </div>
                  );
                }
                if (sentimentCounts[sentiment] > 0 && sentiment === 'moreInfo') {
                  return (
                    <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                      <MoreInfo size={15} />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
          <div className="txt">
            {totalSentimentsCount}
          </div>
        </div>}
      <div className="answers annotation">
        <Translate value="debate.thread.numberOfResponses" count={postChildren ? postChildren.length : 0} />
      </div>
      <div className="clear">&nbsp;</div>
    </div>
  );
};

export default PostActions;