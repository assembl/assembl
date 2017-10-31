import React from 'react';
import { withApollo } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import { MEDIUM_SCREEN_WIDTH } from '../../../constants';
import { answerTooltip, sharePostTooltip } from '../../common/tooltips';

import getOverflowMenuForPost from './overflowMenu';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { promptForLoginOr, openShareModal, displayModal } from '../../../utils/utilityManager';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
import Sentiments from './sentiments';
import getSentimentStats from './sentimentStats';
import sentimentDefinitions from './sentimentDefinitions';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';

class PostActions extends React.Component {
  constructor(props) {
    super(props);
    const screenWidth = window.innerWidth;
    this.state = {
      screenWidth: screenWidth
    };
    this.updateDimensions = this.updateDimensions.bind(this);
    this.displayPhaseCompletedModal = this.displayPhaseCompletedModal.bind(this);
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
  displayPhaseCompletedModal() {
    const body = (
      <div>
        <Translate value="debate.noAnswer" />
      </div>
    );
    displayModal(null, body, true, null, null, true);
  }
  render() {
    const {
      client,
      creatorUserId,
      postId,
      sentimentCounts,
      mySentiment,
      handleAnswerClick,
      handleEditClick,
      numChildren,
      routerParams,
      debateData,
      identifier
    } = this.props;
    let count = 0;
    const totalSentimentsCount = sentimentCounts
      ? sentimentCounts.like + sentimentCounts.disagree + sentimentCounts.dontUnderstand + sentimentCounts.moreInfo
      : 0;
    const connectedUserId = getConnectedUserId();
    const userCanDeleteThisMessage =
      (connectedUserId === String(creatorUserId) && connectedUserCan(Permissions.DELETE_MY_POST)) ||
      connectedUserCan(Permissions.DELETE_POST);
    const userCanEditThisMessage = connectedUserId === String(creatorUserId) && connectedUserCan(Permissions.EDIT_MY_POST);
    const modalTitle = <Translate value="debate.sharePost" />;
    const useSocial = debateData.useSocialMedia;
    let overflowMenu = null;
    const tooltipPlacement = this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? 'left' : 'top';
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, identifier);
    if (userCanDeleteThisMessage || userCanEditThisMessage) {
      overflowMenu = (
        <div className="overflow-action">
          <OverlayTrigger
            trigger="click"
            rootClose
            placement={tooltipPlacement}
            overlay={getOverflowMenuForPost(postId, userCanDeleteThisMessage, userCanEditThisMessage, client, handleEditClick)}
          >
            <div>
              {this.state.screenWidth >= MEDIUM_SCREEN_WIDTH
                ? <span className="assembl-icon-ellipsis-vert">&nbsp;</span>
                : <span className="assembl-icon-ellipsis">&nbsp;</span>}
            </div>
          </OverlayTrigger>
        </div>
      );
    }
    return (
      <div>
        <div className="post-icons">
          {handleAnswerClick &&
            <div
              className="post-action"
              onClick={isPhaseCompleted ? this.displayPhaseCompletedModal : promptForLoginOr(handleAnswerClick)}
            >
              <OverlayTrigger placement={tooltipPlacement} overlay={answerTooltip}>
                <span className="assembl-icon-back-arrow color" />
              </OverlayTrigger>
            </div>}
          <div
            className="post-action"
            onClick={() => {
              return openShareModal({
                title: modalTitle,
                routerParams: routerParams,
                elementId: postId,
                social: useSocial
              });
            }}
          >
            <OverlayTrigger placement={tooltipPlacement} overlay={sharePostTooltip}>
              <span className="assembl-icon-share color" />
            </OverlayTrigger>
          </div>
          <Sentiments
            sentimentCounts={sentimentCounts}
            mySentiment={mySentiment}
            placement={tooltipPlacement}
            client={client}
            postId={postId}
            isPhaseCompleted={isPhaseCompleted}
          />
          {this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? null : overflowMenu}
        </div>
        {totalSentimentsCount > 0
          ? <OverlayTrigger
            overlay={getSentimentStats(totalSentimentsCount, sentimentCounts, mySentiment)}
            placement={tooltipPlacement}
          >
            <div className="sentiments-count margin-m">
              <div>
                {sentimentDefinitions.reduce((result, sentiment) => {
                  if (sentimentCounts[sentiment.camelType] > 0) {
                    result.push(
                      <div className="min-sentiment" key={sentiment.type} style={{ left: `${(count += 1 * 6)}px` }}>
                        <sentiment.SvgComponent size={15} />
                      </div>
                    );
                  }
                  return result;
                }, [])}
              </div>
              <div className="txt">
                {this.state.screenWidth >= MEDIUM_SCREEN_WIDTH
                  ? totalSentimentsCount
                  : <Translate value="debate.thread.numberOfReactions" count={totalSentimentsCount} />}
              </div>
            </div>
          </OverlayTrigger>
          : <div className="empty-sentiments-count" />}
        {this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? overflowMenu : null}
        <div className="answers annotation">
          <Translate value="debate.thread.numberOfResponses" count={numChildren ? numChildren.length : 0} />
        </div>
        <div className="clear">&nbsp;</div>
      </div>
    );
  }
}

export default withApollo(PostActions);