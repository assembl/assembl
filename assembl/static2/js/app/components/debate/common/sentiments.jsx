import React from 'react';
import { Translate } from 'react-redux-i18n';
import addSentimentMutation from '../../../graphql/mutations/addSentiment.graphql';
import deleteSentimentMutation from '../../../graphql/mutations/deleteSentiment.graphql';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { inviteUserToLogin, displayModal } from '../../../utils/utilityManager';
import sentimentDefinitions from './sentimentDefinitions';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';

const Sentiment = ({ sentimentCounts, mySentiment, sentiment, client, isSelected, postId, placement, isPhaseCompleted }) => {
  const sentimentComponent = (
    <div
      className={isSelected ? 'sentiment sentiment-active' : 'sentiment'}
      onClick={() => {
        const isUserConnected = getConnectedUserId();
        if (!isUserConnected) {
          inviteUserToLogin();
        } else if (isPhaseCompleted) {
          const body = (
            <div>
              <Translate value="debate.isCompleted" />
            </div>
          );
          displayModal(null, body, true, null, null, true);
        } else {
          client.mutate(
            isSelected
              ? {
                mutation: deleteSentimentMutation,
                variables: { postId: postId },
                optimisticResponse: {
                  deleteSentiment: {
                    post: {
                      id: postId,
                      sentimentCounts: {
                        like: sentimentCounts.like - (mySentiment === sentiment.type ? 1 : 0),
                        disagree: sentimentCounts.disagree - (mySentiment === sentiment.type ? 1 : 0),
                        dontUnderstand: sentimentCounts.dontUnderstand - (mySentiment === sentiment.type ? 1 : 0),
                        moreInfo: sentimentCounts.moreInfo - (mySentiment === sentiment.type ? 1 : 0),
                        __typename: 'SentimentCounts'
                      },
                      mySentiment: null,
                      __typename: 'Post'
                    },
                    __typename: 'DeleteSentiment'
                  }
                }
              }
              : {
                mutation: addSentimentMutation,
                variables: { postId: postId, type: sentiment.type },
                optimisticResponse: {
                  addSentiment: {
                    post: {
                      id: postId,
                      sentimentCounts: {
                        like:
                            sentiment.camelType === 'like'
                              ? sentimentCounts.like + 1
                              : sentimentCounts.like - (mySentiment === 'LIKE' ? 1 : 0),
                        disagree:
                            sentiment.camelType === 'disagree'
                              ? sentimentCounts.disagree + 1
                              : sentimentCounts.disagree - (mySentiment === 'DISAGREE' ? 1 : 0),
                        dontUnderstand:
                            sentiment.camelType === 'dontUnderstand'
                              ? sentimentCounts.dontUnderstand + 1
                              : sentimentCounts.dontUnderstand - (mySentiment === 'DONT_UNDERSTAND' ? 1 : 0),
                        moreInfo:
                            sentiment.camelType === 'moreInfo'
                              ? sentimentCounts.moreInfo + 1
                              : sentimentCounts.moreInfo - (mySentiment === 'MORE_INFO' ? 1 : 0),
                        __typename: 'SentimentCounts'
                      },
                      mySentiment: sentiment.type,
                      __typename: 'Post'
                    },
                    __typename: 'AddSentiment'
                  }
                }
              }
          );
        }
      }}
    >
      <sentiment.SvgComponent size={25} />
    </div>
  );
  return <ResponsiveOverlayTrigger placement={placement} tooltip={sentiment.tooltip} component={sentimentComponent} />;
};

export default ({ sentimentCounts, mySentiment, client, postId, placement, isPhaseCompleted }) => (
  <div className="add-sentiment">
    {sentimentDefinitions.map(sentiment => (
      <Sentiment
        key={sentiment.type}
        sentimentCounts={sentimentCounts}
        mySentiment={mySentiment}
        sentiment={sentiment}
        isSelected={mySentiment === sentiment.type}
        postId={postId}
        client={client}
        placement={placement}
        isPhaseCompleted={isPhaseCompleted}
      />
    ))}
  </div>
);