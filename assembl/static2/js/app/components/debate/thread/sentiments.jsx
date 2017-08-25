import React from 'react';
import { OverlayTrigger } from 'react-bootstrap';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import DontUnderstand from '../../svg/dontUnderstand';
import MoreInfo from '../../svg/moreInfo';
import { MEDIUM_SCREEN_WIDTH } from '../../../constants';
import { likeTooltip, disagreeTooltip, dontUnderstandTooltip, moreInfoTooltip } from '../../common/tooltips';
import addSentimentMutation from '../../../graphql/mutations/addSentiment.graphql';
import deleteSentimentMutation from '../../../graphql/mutations/deleteSentiment.graphql';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { inviteUserToLogin } from '../../../utils/utilityManager';

const Sentiment = ({ sentiment, client, screenWidth, isSelected, postId }) => {
  return (
    <OverlayTrigger placement={screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'} overlay={sentiment.tooltip}>
      <div
        className={isSelected ? 'sentiment sentiment-active' : 'sentiment'}
        onClick={() => {
          const isUserConnected = getConnectedUserId();
          if (!isUserConnected) {
            inviteUserToLogin();
          } else {
            client.mutate(
              isSelected
                ? {
                  mutation: deleteSentimentMutation,
                  variables: { postId: postId }
                }
                : {
                  mutation: addSentimentMutation,
                  variables: { postId: postId, type: sentiment.type }
                }
            );
          }
        }}
      >
        <sentiment.svg size={25} />
      </div>
    </OverlayTrigger>
  );
};

export default ({ mySentiment, screenWidth, client, postId }) => {
  const sentiments = [
    { type: 'LIKE', tooltip: likeTooltip, svg: Like },
    { type: 'DISAGREE', tooltip: disagreeTooltip, svg: Disagree },
    { type: 'DONT_UNDERSTAND', tooltip: dontUnderstandTooltip, svg: DontUnderstand },
    { type: 'MORE_INFO', tooltip: moreInfoTooltip, svg: MoreInfo }
  ];
  return (
    <div className="add-sentiment">
      {sentiments.map((sentiment, index) => {
        return (
          <Sentiment
            key={index}
            sentiment={sentiment}
            isSelected={mySentiment === sentiment.type}
            screenWidth={screenWidth}
            postId={postId}
            client={client}
          />
        );
      })}
    </div>
  );
};