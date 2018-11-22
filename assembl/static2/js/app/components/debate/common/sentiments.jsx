// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import addSentimentMutation from '../../../graphql/mutations/addSentiment.graphql';
import deleteSentimentMutation from '../../../graphql/mutations/deleteSentiment.graphql';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { SENTIMENTS } from '../../../constants';
import { inviteUserToLogin, displayModal } from '../../../utils/utilityManager';
import sentimentDefinitions, { type SentimentDefinition } from './sentimentDefinitions';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import manageErrorAndLoading from '../../../components/common/manageErrorAndLoading';

type SentimentProps = {
  isPhaseCompleted: boolean,
  isSelected: boolean,
  mySentiment: ?string,
  placement: OverlayPlacement,
  postId: string,
  sentiment: SentimentDefinition,
  sentimentCounts: ?SentimentCountsFragment,
  addSentiment: Function,
  deleteSentiment: Function
};

export const DumbSentiment = ({
  sentimentCounts,
  mySentiment,
  sentiment,
  isSelected,
  postId,
  placement,
  isPhaseCompleted,
  addSentiment,
  deleteSentiment
}: SentimentProps) => {
  const likeCount = (sentimentCounts && sentimentCounts.like) || 0;
  const disagreeCount = (sentimentCounts && sentimentCounts.disagree) || 0;
  const dontUnderstandCount = (sentimentCounts && sentimentCounts.dontUnderstand) || 0;
  const moreInfoCount = (sentimentCounts && sentimentCounts.moreInfo) || 0;

  const newDeleteCount = (count: number, countType: string): number =>
    count - (mySentiment === sentiment.type && sentiment.type === countType ? 1 : 0);

  const newAddCount = (count: number, countType: string): number =>
    (sentiment.type === countType ? count + 1 : count - (mySentiment === countType ? 1 : 0));

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
        } else if (isSelected) {
          deleteSentiment({
            variables: { postId: postId },
            optimisticResponse: {
              deleteSentiment: {
                post: {
                  id: postId,
                  sentimentCounts: {
                    like: newDeleteCount(likeCount, SENTIMENTS.like),
                    disagree: newDeleteCount(disagreeCount, SENTIMENTS.disagree),
                    dontUnderstand: newDeleteCount(dontUnderstandCount, SENTIMENTS.dontUnderstand),
                    moreInfo: newDeleteCount(moreInfoCount, SENTIMENTS.moreInfo),
                    __typename: 'SentimentCounts'
                  },
                  mySentiment: null,
                  __typename: 'Post'
                },
                __typename: 'DeleteSentiment'
              }
            }
          });
        } else {
          addSentiment({
            variables: { postId: postId, type: sentiment.type },
            optimisticResponse: {
              addSentiment: {
                post: {
                  id: postId,
                  sentimentCounts: {
                    like: newAddCount(likeCount, SENTIMENTS.like),
                    disagree: newAddCount(disagreeCount, SENTIMENTS.disagree),
                    dontUnderstand: newAddCount(dontUnderstandCount, SENTIMENTS.dontUnderstand),
                    moreInfo: newAddCount(moreInfoCount, SENTIMENTS.moreInfo),
                    __typename: 'SentimentCounts'
                  },
                  mySentiment: sentiment.type,
                  __typename: 'Post'
                },
                __typename: 'AddSentiment'
              }
            }
          });
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

export const Sentiment = compose(
  graphql(addSentimentMutation, {
    name: 'addSentiment'
  }),
  graphql(deleteSentimentMutation, {
    name: 'deleteSentiment'
  }),
  manageErrorAndLoading({ displayLoader: true })
)(DumbSentiment);

type SentimentsProps = {
  isPhaseCompleted: boolean,
  mySentiment: ?string,
  placement: OverlayPlacement,
  postId: string,
  sentimentCounts: ?SentimentCountsFragment,
  customSentimentDefinitions?: Array<SentimentDefinition>,
  onCompleted?: () => void
};

const Sentiments = ({
  sentimentCounts,
  mySentiment,
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