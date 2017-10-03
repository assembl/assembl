import React from 'react';
import { withApollo } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import { MEDIUM_SCREEN_WIDTH } from '../../../constants';
import { answerTooltip, shareTooltip } from '../../common/tooltips';

import getOverflowMenuForPost from './overflowMenu';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { promptForLoginOr, displayModal, closeModal } from '../../../utils/utilityManager';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
import Sentiments from './sentiments';
import getSentimentStats from './sentimentStats';
import sentimentDefinitions from './sentimentDefinitions';
import { get } from '../../../utils/routeMap';
import SocialShare from '../../common/socialShare';

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
      postSubject,
      debateData
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
    const { slug, phase, themeId } = routerParams;
    const confirmModal = () => {
      const title = postSubject;
      const url = `${window.location.protocol}//${window.location.host}${get('debate', {
        slug: slug,
        phase: phase
      })}${get('theme', {
        themeId: themeId
      })}/#${postId}`;
      const social = debateData.useSocialMedia;
      const body = <SocialShare url={url} onClose={closeModal} social={social} />;
      const footer = false;
      const footerTxt = null;
      return displayModal(title, body, footer, footerTxt);
    };
    let overflowMenu = null;
    if (userCanDeleteThisMessage || userCanEditThisMessage) {
      overflowMenu = (
        <div className="overflow-action">
          <OverlayTrigger
            trigger="click"
            rootClose
            placement={this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'}
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
          <div className="post-action" onClick={promptForLoginOr(handleAnswerClick)}>
            <OverlayTrigger placement={this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'} overlay={answerTooltip}>
              <span className="assembl-icon-back-arrow color" />
            </OverlayTrigger>
          </div>
          <div
            className="post-action"
            onClick={() => {
              return confirmModal(postId);
            }}
          >
            <OverlayTrigger placement={this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? 'right' : 'top'} overlay={shareTooltip}>
              <span className="assembl-icon-share color" />
            </OverlayTrigger>
          </div>
          <Sentiments
            sentimentCounts={sentimentCounts}
            mySentiment={mySentiment}
            screenWidth={this.state.screenWidth}
            client={client}
            postId={postId}
          />
          {this.state.screenWidth >= MEDIUM_SCREEN_WIDTH ? null : overflowMenu}
        </div>
        {totalSentimentsCount > 0 &&
          <OverlayTrigger overlay={getSentimentStats(totalSentimentsCount, sentimentCounts, mySentiment)} placement="right">
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
          </OverlayTrigger>}
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