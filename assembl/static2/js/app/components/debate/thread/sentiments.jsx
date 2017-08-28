import React from 'react';
import { OverlayTrigger } from 'react-bootstrap';
import { MEDIUM_SCREEN_WIDTH } from '../../../constants';
import addSentimentMutation from '../../../graphql/mutations/addSentiment.graphql';
import deleteSentimentMutation from '../../../graphql/mutations/deleteSentiment.graphql';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { inviteUserToLogin } from '../../../utils/utilityManager';
import sentimentDefinitions from './sentimentDefinitions';

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
        <sentiment.SvgComponent size={25} />
      </div>
    </OverlayTrigger>
  );
};

export default ({ mySentiment, screenWidth, client, postId }) => {
  return (
    <div className="add-sentiment">
      {sentimentDefinitions.map((sentiment, index) => {
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