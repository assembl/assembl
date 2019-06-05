// @flow
import get from 'lodash/get';
import * as React from 'react';
import { ApolloClient, compose, withApollo } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import classnames from 'classnames';
import { MEDIUM_SCREEN_WIDTH } from '../../../constants';
import {
  sharePostTooltip,
  validateMessageTooltip,
  deniedMessageTooltip,
  editMessageTooltip,
  deleteMessageTooltip
} from '../../common/tooltips';

import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { openShareModal } from '../../../utils/utilityManager';
import Permissions, { connectedUserCan, connectedUserIsModerator } from '../../../utils/permissions';
import Sentiments from './sentiments';
import getSentimentStats from './sentimentStats';
import sentimentDefinitions from './sentimentDefinitions';
import { getIsPhaseCompletedById } from '../../../utils/timeline';
import { withScreenWidth } from '../../common/screenDimensions';
import DeletePostButton from './deletePostButton';
import ValidatePostButton from './validatePostButton';
import EditPostButton from './editPostButton';

export type Props = {
  timeline: Timeline,
  client: ApolloClient,
  creatorUserId: string,
  debateData: DebateData,
  editable: boolean,
  handleEditClick: Function,
  phaseId: string,
  mySentiment: string,
  numChildren: number,
  postId: string,
  routerParams: RouterParams,
  screenWidth: number,
  sentimentCounts: SentimentCountsFragment,
  isPending: boolean,
  isMultiColumns: boolean,
  isDebateModerated: boolean
};

export class PostActions extends React.Component<Props> {
  static defaultProps = {
    editable: true,
    numChildren: 0
  };

  render() {
    const {
      client,
      creatorUserId,
      debateData,
      timeline,
      editable,
      handleEditClick,
      phaseId,
      mySentiment,
      numChildren,
      postId,
      routerParams,
      screenWidth,
      sentimentCounts,
      isPending,
      isMultiColumns,
      isDebateModerated
    } = this.props;
    let count = 0;
    const totalSentimentsCount = sentimentCounts
      ? sentimentCounts.like + sentimentCounts.disagree + sentimentCounts.dontUnderstand + sentimentCounts.moreInfo
      : 0;
    const connectedUserId = getConnectedUserId();
    const userCanDeleteThisMessage =
      (connectedUserId === String(creatorUserId) && connectedUserCan(Permissions.DELETE_MY_POST)) ||
      connectedUserCan(Permissions.DELETE_POST);
    const modalTitle = <Translate value="debate.sharePost" />;
    if (!debateData) return null;
    const useSocial = debateData.useSocialMedia;
    const tooltipPlacement = screenWidth >= MEDIUM_SCREEN_WIDTH ? 'left' : 'top';
    const isPhaseCompleted = getIsPhaseCompletedById(timeline, phaseId);
    const shareIcon = <span className={classnames('assembl-icon-share color', { 'share-multiColumns': isMultiColumns })} />;
    const isPendingForModerator = isPending && connectedUserIsModerator();
    const isPendingForUser = isPending && !connectedUserIsModerator();
    const deleteModalMessage = isPendingForModerator ? 'debate.confirmRefusalBody' : null;
    const userCanEditThisMessage =
      connectedUserId === String(creatorUserId) &&
      connectedUserCan(Permissions.EDIT_MY_POST) &&
      (isPendingForUser || !isDebateModerated || connectedUserIsModerator());
    const showLastSeparator =
      !isPendingForUser && ((editable && userCanEditThisMessage) || userCanDeleteThisMessage || isPendingForModerator);
    return (
      <div className="post-actions">
        <div className="post-icons">
          {!isPending ? (
            <React.Fragment>
              <div
                className="post-action"
                onClick={() =>
                  openShareModal({
                    type: 'post',
                    title: modalTitle,
                    routerParams: routerParams,
                    postId: postId,
                    social: useSocial
                  })
                }
              >
                <ResponsiveOverlayTrigger placement={tooltipPlacement} tooltip={sharePostTooltip}>
                  {shareIcon}
                </ResponsiveOverlayTrigger>
              </div>
            </React.Fragment>
          ) : null}
          {!isPendingForUser ? (
            <Sentiments
              sentimentCounts={sentimentCounts}
              mySentiment={mySentiment}
              placement={tooltipPlacement}
              client={client}
              postId={postId}
              isPhaseCompleted={isPhaseCompleted}
            />
          ) : null}
        </div>
        {totalSentimentsCount > 0 ? (
          <OverlayTrigger
            overlay={getSentimentStats(totalSentimentsCount, sentimentCounts, mySentiment)}
            placement={tooltipPlacement}
          >
            <div className="sentiments-count">
              <div>
                {sentimentDefinitions.reduce((result, sentiment) => {
                  const sentimentCount = get(sentimentCounts, sentiment.camelType, 0);
                  if (sentimentCount > 0) {
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
                {screenWidth >= MEDIUM_SCREEN_WIDTH ? (
                  totalSentimentsCount
                ) : (
                  <Translate value="debate.thread.numberOfReactions" count={totalSentimentsCount} />
                )}
              </div>
            </div>
          </OverlayTrigger>
        ) : (
          <div className="empty-sentiments-count" />
        )}
        <div className={classnames({ 'post-actions-separator': showLastSeparator })} />
        {isPendingForModerator ? (
          <ResponsiveOverlayTrigger placement={tooltipPlacement} tooltip={validateMessageTooltip}>
            <ValidatePostButton postId={postId} linkClassName="post-action" />
          </ResponsiveOverlayTrigger>
        ) : null}
        {userCanDeleteThisMessage ? (
          <ResponsiveOverlayTrigger
            placement={tooltipPlacement}
            tooltip={isPendingForModerator ? deniedMessageTooltip : deleteMessageTooltip}
          >
            <DeletePostButton
              modalBodyMessage={deleteModalMessage}
              postId={postId}
              linkClassName="post-action"
              isPendingForModerator={isPendingForModerator}
            />
          </ResponsiveOverlayTrigger>
        ) : null}
        {editable && userCanEditThisMessage ? (
          <ResponsiveOverlayTrigger placement={tooltipPlacement} tooltip={editMessageTooltip}>
            <EditPostButton handleClick={handleEditClick} linkClassName="post-action" />
          </ResponsiveOverlayTrigger>
        ) : null}
        {editable ? (
          <div className="answers annotation">
            <Translate value="debate.thread.numberOfResponses" count={numChildren} />
          </div>
        ) : null}
        <div className="clear">&nbsp;</div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  timeline: state.timeline
});

export default compose(connect(mapStateToProps), withScreenWidth, withApollo)(PostActions);