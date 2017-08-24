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

const Sentiment = ({ sentiment, client, screenWidth, isSelected, postId }) => {
  return (
    <OverlayTrigger placement={screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'} overlay={sentiment.tooltip}>
      <div
        className={isSelected ? 'sentiment sentiment-active' : 'sentiment'}
        onClick={() => {
          return client.mutate(
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
        }}
      >
        <sentiment.Svg size={25} />
      </div>
    </OverlayTrigger>
  );
};

export default ({ mySentiment, screenWidth, client, postId }) => {
  const sentiments = [
    { type: 'LIKE', tooltip: likeTooltip, Svg: Like },
    { type: 'DISAGREE', tooltip: disagreeTooltip, Svg: Disagree },
    { type: 'DONT_UNDERSTAND', tooltip: dontUnderstandTooltip, Svg: DontUnderstand },
    { type: 'MORE_INFO', tooltip: moreInfoTooltip, Svg: MoreInfo }
  ];
  return (
    <div className="add-sentiment">
      {sentiments.map((sentiment) => {
        return (
          <Sentiment
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