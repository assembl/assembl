import React from 'react';
import { Translate } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import { MEDIUM_SCREEN_WIDTH } from '../../../constants';
import {
  answerTooltip,
  shareTooltip,
  likeTooltip,
  disagreeTooltip,
  dontUnderstandTooltip,
  moreInfoTooltip
} from '../../common/tooltips';

import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import DontUnderstand from '../../svg/dontUnderstand';
import MoreInfo from '../../svg/moreInfo';
import getOverflowMenuForPost from './overflowMenu';

class PostActions extends React.Component {
  constructor(props) {
    super(props);
    const screenWidth = window.innerWidth;
    this.state = {
      screenWidth: screenWidth
    };
    this.updateDimensions = this.updateDimensions.bind(this);
  }
  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }
  updateDimensions() {
    const screenWidth = window.innerWidth;
    this.setState({
      screenWidth: screenWidth
    });
  }
  render() {
    const { postId, sentimentCounts, mySentiment, handleAnswerClick, postChildren } = this.props;
    let count = 0;
    const totalSentimentsCount = sentimentCounts
      ? sentimentCounts.like + sentimentCounts.disagree + sentimentCounts.dontUnderstand + sentimentCounts.moreInfo
      : 0;

    return (
      <div>
        <div className="post-icons">
          <div className="post-action" onClick={handleAnswerClick}>
            <OverlayTrigger placement={this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'} overlay={answerTooltip}>
              <span className="assembl-icon-back-arrow color" />
            </OverlayTrigger>
          </div>
          <div className="post-action">
            <OverlayTrigger placement={this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'} overlay={shareTooltip}>
              <span className="assembl-icon-share color" />
            </OverlayTrigger>
          </div>
          <div className="add-sentiment">
            <OverlayTrigger placement={this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'} overlay={likeTooltip}>
              <div className={mySentiment === 'LIKE' ? 'sentiment sentiment-active' : 'sentiment'}>
                <Like size={25} />
              </div>
            </OverlayTrigger>
            <OverlayTrigger placement={this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'} overlay={disagreeTooltip}>
              <div className={mySentiment === 'DISAGREE' ? 'sentiment sentiment-active' : 'sentiment'}>
                <Disagree size={25} />
              </div>
            </OverlayTrigger>
            <OverlayTrigger placement={this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'} overlay={dontUnderstandTooltip}>
              <div className={mySentiment === 'DONT_UNDERSTAND' ? 'sentiment sentiment-active' : 'sentiment'}>
                <DontUnderstand size={25} />
              </div>
            </OverlayTrigger>
            <OverlayTrigger placement={this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'} overlay={moreInfoTooltip}>
              <div className={mySentiment === 'MORE_INFO' ? 'sentiment sentiment-active' : 'sentiment'}>
                <MoreInfo size={25} />
              </div>
            </OverlayTrigger>
          </div>
          <div className="overflow-action">
            <OverlayTrigger
              trigger="click"
              rootClose
              placement={this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'}
              overlay={getOverflowMenuForPost(postId)}
            >
              <div>
                {this.state.screenWidth >= MEDIUM_SCREEN_WIDTH
                  ? <span className="assembl-icon-ellipsis-vert">&nbsp;</span>
                  : <span className="assembl-icon-ellipsis">&nbsp;</span>}
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
  }
}

export default PostActions;