import React from 'react';
import { OverlayTrigger } from 'react-bootstrap';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import DontUnderstand from '../../svg/dontUnderstand';
import MoreInfo from '../../svg/moreInfo';
import { MEDIUM_SCREEN_WIDTH } from '../../../constants';
import { likeTooltip, disagreeTooltip, dontUnderstandTooltip, moreInfoTooltip } from '../../common/tooltips';
import addSentimentMutation from '../../../graphql/mutations/addSentiment.graphql';

const Sentiment = ({ type, client, screenWidth, tooltip, mySentiment, postId, Svg }) => {
  return (
    <OverlayTrigger placement={screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'} overlay={tooltip}>
      <div
        className={mySentiment === type ? 'sentiment sentiment-active' : 'sentiment'}
        onClick={() => {
          return client.mutate({ mutation: addSentimentMutation, variables: { postId: postId, type: type } });
        }}
      >
        <Svg size={25} />
      </div>
    </OverlayTrigger>
  );
};

export default ({ mySentiment, screenWidth, client, postId }) => {
  return (
    <div className="add-sentiment">
      <Sentiment
        type="LIKE"
        mySentiment={mySentiment}
        screenWidth={screenWidth}
        tooltip={likeTooltip}
        postId={postId}
        client={client}
        Svg={Like}
      />
      <Sentiment
        type="DISAGREE"
        mySentiment={mySentiment}
        screenWidth={screenWidth}
        tooltip={disagreeTooltip}
        postId={postId}
        client={client}
        Svg={Disagree}
      />
      <Sentiment
        type="DONT_UNDERSTAND"
        mySentiment={mySentiment}
        screenWidth={screenWidth}
        tooltip={dontUnderstandTooltip}
        postId={postId}
        client={client}
        Svg={DontUnderstand}
      />
      <Sentiment
        string="MORE_INFO"
        mySentiment={mySentiment}
        screenWidth={screenWidth}
        tooltip={moreInfoTooltip}
        postId={postId}
        client={client}
        Svg={MoreInfo}
      />
    </div>
  );
};