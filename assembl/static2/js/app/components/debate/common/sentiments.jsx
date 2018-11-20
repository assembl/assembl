// @flow
import React from 'react';
import { type ApolloClient } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import addSentimentMutation from '../../../graphql/mutations/addSentiment.graphql';
import deleteSentimentMutation from '../../../graphql/mutations/deleteSentiment.graphql';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { inviteUserToLogin, displayModal } from '../../../utils/utilityManager';
import sentimentDefinitions, { type SentimentDefinition } from './sentimentDefinitions';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';

type SentimentProps = {
  client: ApolloClient,
  isPhaseCompleted: boolean,
  isSelected: boolean,
  mySentiment: ?string,
  placement: OverlayPlacement,
  postId: string,
  sentiment: SentimentDefinition,
  sentimentCounts: ?SentimentCountsFragment,
  onCompleted: ?Function
};

export const Sentiment = ({
  sentimentCounts,
  mySentiment,
  sentiment,
  client,
  isSelected,
  postId,
  placement,
  isPhaseCompleted,
  onCompleted
}: SentimentProps) => {
  const likeCount = (sentimentCounts && sentimentCounts.like) || 0;
  const disagreeCount = (sentimentCounts && sentimentCounts.disagree) || 0;
  const dontUnderstandCount = (sentimentCounts && sentimentCounts.dontUnderstand) || 0;
  const moreInfoCount = (sentimentCounts && sentimentCounts.moreInfo) || 0;
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
          client
            .mutate(
              isSelected
                ? {
                  mutation: deleteSentimentMutation,
                  variables: { postId: postId },
                  optimisticResponse: {
                    deleteSentiment: {
                      post: {
                        id: postId,
                        sentimentCounts: {
                          like: likeCount - (mySentiment === sentiment.type ? 1 : 0),
                          disagree: disagreeCount - (mySentiment === sentiment.type ? 1 : 0),
                          dontUnderstand: dontUnderstandCount - (mySentiment === sentiment.type ? 1 : 0),
                          moreInfo: moreInfoCount - (mySentiment === sentiment.type ? 1 : 0),
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
                          like: sentiment.camelType === 'like' ? likeCount + 1 : likeCount - (mySentiment === 'LIKE' ? 1 : 0),
                          disagree:
                              sentiment.camelType === 'disagree'
                                ? disagreeCount + 1
                                : disagreeCount - (mySentiment === 'DISAGREE' ? 1 : 0),
                          dontUnderstand:
                              sentiment.camelType === 'dontUnderstand'
                                ? dontUnderstandCount + 1
                                : dontUnderstandCount - (mySentiment === 'DONT_UNDERSTAND' ? 1 : 0),
                          moreInfo:
                              sentiment.camelType === 'moreInfo'
                                ? moreInfoCount + 1
                                : moreInfoCount - (mySentiment === 'MORE_INFO' ? 1 : 0),
                          __typename: 'SentimentCounts'
                        },
                        mySentiment: sentiment.type,
                        __typename: 'Post'
                      },
                      __typename: 'AddSentiment'
                    }
                  }
                }
            )
            .then(onCompleted);
        }
      }}
    >
      <sentiment.SvgComponent size={23} />
    </div>
  );
  return (
    <ResponsiveOverlayTrigger placement={placement} tooltip={sentiment.tooltip}>
      {sentimentComponent}
    </ResponsiveOverlayTrigger>
  );
};

type SentimentsProps = {
  client: ApolloClient,
  isPhaseCompleted: boolean,
  mySentiment: ?string,
  placement: OverlayPlacement,
  postId: string,
  sentimentCounts: ?SentimentCountsFragment,
  customSentimentDefinitions?: Array<SentimentDefinition>,
  onCompleted?: Function
};

const Sentiments = ({
  sentimentCounts,
  mySentiment,
  client,
  postId,
  placement,
  isPhaseCompleted,
  onCompleted,
  customSentimentDefinitions
}: SentimentsProps) => (
  <div className="add-sentiment">
    {customSentimentDefinitions &&
      customSentimentDefinitions.map(sentiment => (
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
          onCompleted={onCompleted}
        />
      ))}
  </div>
);

Sentiments.defaultProps = {
  customSentimentDefinitions: sentimentDefinitions,
  onCompleted: () => {}
};

export default Sentiments;