// @flow
import * as React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import classnames from 'classnames';
import moment from 'moment';
import {
  getDomElementOffset,
  elementContainsSelection,
  formatedSuggestedTagList,
  formatedTagList
} from '../../../../utils/globalFunctions';
import { connectedUserIsModerator, connectedUserIsAdmin } from '../../../../utils/permissions';
import DisplayResponseAuthor from '../../../common/displayResponseAuthor';
import CircleAvatar from '../../../common/circleAvatar';
import Attachments from '../../../common/attachments';
import PostActions from '../../common/postActions';
import AnswerForm from '../../thread/answerForm';
import Nuggets from '../../thread/nuggets';
import TagOnPost from '../../../tagOnPost/tagOnPost';
import SuggestionContainer from '../../../common/suggestionContainer/suggestionContainer';
import PostBody from './postBody';
import HarvestingMenu from '../../../harvesting/harvestingMenu';
import { getExtractTagId } from '../../../../utils/extract';
import { PublicationStates, pendingOrange, MESSAGE_VIEW } from '../../../../constants';

// Type imports
import type { Props as PostProps } from './index';
import type { Props as SuggestionContainerProps } from '../../../common/suggestionContainer/suggestionContainer';
import type { Props as TagOnPostProps } from '../../../tagOnPost/tagOnPost';

type Props = PostProps & {
  body: string,
  handleEditClick: Function,
  isHarvesting: boolean,
  isHarvestable: boolean,
  modifiedSubject: ?React.Element<any>,
  multiColumns: boolean,
  subject: string,
  timeline: Timeline,
  connectedUserId: ?string,
  isDebateModerated: boolean
};

type State = {
  showAnswerForm: boolean,
  displayHarvestingAnchor: boolean,
  displayHarvestingBox: boolean,
  harvestingAnchorPosition: Object
};

class PostView extends React.PureComponent<Props, State> {
  answerTextarea: ?HTMLTextAreaElement;

  postView: ?HTMLElement;

  static defaultProps = {
    isHarvesting: false,
    multiColumns: false
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      showAnswerForm: false,
      displayHarvestingAnchor: false,
      displayHarvestingBox: false,
      harvestingAnchorPosition: { x: 0, y: 0 }
    };
  }

  handleAnswerClick = () => {
    this.setState({ showAnswerForm: true }, this.props.measureTreeHeight);
    setTimeout(() => {
      const answerTextarea = this.answerTextarea;
      if (!answerTextarea) return;
      const txtareaOffset = getDomElementOffset(answerTextarea).top;
      window.scrollTo({ top: txtareaOffset - answerTextarea.clientHeight, left: 0, behavior: 'smooth' });
    }, 200);
  };

  hideAnswerForm = () => {
    this.setState({ showAnswerForm: false }, this.props.measureTreeHeight);
  };

  recomputeTreeHeightOnImagesLoad = (el: HTMLElement) => {
    // recompute the tree height after images are loaded
    if (el) {
      const images = el.getElementsByTagName('img');
      Array.from(images).forEach(img =>
        img.addEventListener('load', () => {
          this.props.measureTreeHeight(400);
        })
      );
    }
  };

  getAnchorPosition() {
    const selection = document.getSelection();
    const selectionRange = selection ? selection.getRangeAt(0) : null;
    const selectionPositionY = selectionRange ? selectionRange.getBoundingClientRect().top : 0;
    // $FlowFixMe this.postView may be null
    const anchorPositionX = this.postView.offsetLeft + this.postView.clientWidth / 2;
    // $FlowFixMe this.postView may be null
    const anchorPositionY = selectionPositionY - this.postView.getBoundingClientRect().top;
    return { x: anchorPositionX, y: anchorPositionY };
  }

  handleMouseUpWhileHarvesting = (): void => {
    const { isHarvesting } = this.props;
    const { dbId } = this.props.data.post;
    const isSelectionInBody = elementContainsSelection(document.getElementById(getExtractTagId(dbId)));
    if (isHarvesting && isSelectionInBody) {
      const harvestingAnchorPosition = this.getAnchorPosition();
      this.setState({ displayHarvestingAnchor: true, harvestingAnchorPosition: harvestingAnchorPosition });
    } else {
      this.setState({ displayHarvestingAnchor: false });
    }
  };

  handleClickAnchor = (): void => {
    const { displayHarvestingAnchor, displayHarvestingBox } = this.state;
    this.setState({ displayHarvestingAnchor: !displayHarvestingAnchor, displayHarvestingBox: !displayHarvestingBox });
  };

  setHarvestingBoxDisplay = (): void => {
    const { displayHarvestingBox } = this.state;
    this.setState({ displayHarvestingBox: !displayHarvestingBox });
  };

  cancelHarvesting = (): void => {
    this.setState({ displayHarvestingBox: false });
    window.getSelection().removeAllRanges();
  };

  render() {
    const {
      attachments,
      bodyMimeType,
      creator,
      dbId,
      extracts,
      indirectIdeaContentLinks,
      keywords,
      modified,
      mySentiment,
      parentPostCreator,
      publicationState,
      sentimentCounts,
      tags
    } = this.props.data.post;
    const {
      borderLeftColor,
      handleEditClick,
      contentLocale,
      id,
      lang,
      ideaId,
      refetchIdea,
      // creationDate is retrieved by IdeaWithPosts query, not PostQuery
      creationDate,
      fullLevel,
      numChildren,
      routerParams,
      debateData,
      nuggetsManager,
      rowIndex,
      originalLocale,
      phaseId,
      body,
      subject,
      modifiedSubject,
      multiColumns,
      isHarvesting,
      isHarvestable,
      isDebateModerated
    } = this.props;

    const parentPostAuthorFullname = parentPostCreator ? parentPostCreator.displayName : null;
    const isPending = publicationState === PublicationStates.SUBMITTED_AWAITING_MODERATION;
    const isPendingPostForModerator = connectedUserIsModerator() && isPending;
    const translate = contentLocale !== originalLocale;

    const completeLevelArray = fullLevel ? [rowIndex, ...fullLevel.split('-').map(string => Number(string))] : [rowIndex];

    const answerTextareaRef = (el: ?HTMLTextAreaElement) => {
      this.answerTextarea = el;
    };

    const boxStyle = {
      borderLeftColor: isPending ? pendingOrange : borderLeftColor
    };
    let canReply = !multiColumns;
    // If we're in thread mode, check if the first idea associated to the post is multi columns.
    if (!multiColumns && indirectIdeaContentLinks && indirectIdeaContentLinks.length > 0) {
      canReply =
        indirectIdeaContentLinks[0].idea && indirectIdeaContentLinks[0].idea.messageViewOverride !== MESSAGE_VIEW.messageColumns;
    }

    const { displayHarvestingAnchor, displayHarvestingBox, harvestingAnchorPosition } = this.state;

    const { refetch } = this.props.data;

    const relatedIdeasTitles = indirectIdeaContentLinks
      ? indirectIdeaContentLinks.map(link => link && link.idea && link.idea.title)
      : [];
    const hasRelatedIdeas = relatedIdeasTitles.length > 0;
    const isPublished = publicationState === 'PUBLISHED';
    let userName = isPublished ? creator.displayName : I18n.t('debate.postAwaitingModeration');
    if (creator.isDeleted) {
      userName = I18n.t('deletedUser');
    }

    const tagOnPostProps: TagOnPostProps = {
      isAdmin: connectedUserIsAdmin(),
      postId: id,
      tagList: formatedTagList(tags),
      suggestedTagList: formatedSuggestedTagList(keywords)
    };

    const suggestionContainerProps: SuggestionContainerProps = {
      suggestionList: relatedIdeasTitles,
      suggestionContainerTitle: I18n.t('debate.thread.linkIdea')
    };

    const displayedPublishedDate = moment(creationDate)
      .locale(contentLocale)
      .fromNow();

    return (
      <div
        ref={(p) => {
          this.postView = p;
        }}
      >
        {!multiColumns && (
          <Nuggets extracts={extracts} postId={id} nuggetsManager={nuggetsManager} completeLevel={completeLevelArray.join('-')} />
        )}
        {isHarvesting && (
          <HarvestingMenu
            postId={id}
            lang={contentLocale}
            extracts={extracts}
            isAuthorAccountDeleted={creator.isDeleted}
            harvestingAnchorPosition={harvestingAnchorPosition}
            refetchPost={refetch}
            displayHarvestingAnchor={displayHarvestingAnchor}
            displayHarvestingBox={displayHarvestingBox}
            setHarvestingBoxDisplay={this.setHarvestingBoxDisplay}
            handleClickAnchor={this.handleClickAnchor}
            cancelHarvesting={this.cancelHarvesting}
            showNuggetAction={!multiColumns}
          />
        )}
        <div className={classnames('box', { pending: isPending })} style={boxStyle}>
          <div className="post-row">
            <div className="post-left">
              <div className="post-header">
                <CircleAvatar />
                {creator && (
                  <DisplayResponseAuthor
                    authorFullname={userName}
                    displayedPublishedDate={displayedPublishedDate}
                    parentPostAuthorFullname={parentPostAuthorFullname}
                    publishedDate={creationDate}
                    displayIsEdited={modified}
                  />
                )}
              </div>
              <PostBody
                handleMouseUpWhileHarvesting={this.handleMouseUpWhileHarvesting}
                body={body}
                dbId={dbId}
                extracts={extracts}
                bodyMimeType={bodyMimeType}
                contentLocale={contentLocale}
                id={id}
                lang={lang}
                subject={modifiedSubject}
                originalLocale={originalLocale}
                translate={translate}
                translationEnabled={debateData.translationEnabled}
                bodyDivRef={this.recomputeTreeHeightOnImagesLoad}
                measureTreeHeight={this.props.measureTreeHeight}
                isHarvesting={isHarvesting}
                isHarvestable={isHarvestable}
              />

              <Attachments attachments={attachments} />

              {!multiColumns ? (
                <React.Fragment>
                  <TagOnPost {...tagOnPostProps} />
                  {hasRelatedIdeas ? <SuggestionContainer {...suggestionContainerProps} /> : null}
                  <div className="answers annotation">
                    <Translate value="debate.thread.numberOfResponses" count={numChildren} />
                  </div>
                </React.Fragment>
              ) : null}
            </div>
            <div className={classnames('post-right', { pending: isPending })}>
              <PostActions
                creatorUserId={creator.userId}
                postId={id}
                handleEditClick={handleEditClick}
                sentimentCounts={sentimentCounts}
                mySentiment={mySentiment}
                numChildren={numChildren}
                routerParams={routerParams}
                debateData={debateData}
                postSubject={subject ? subject.replace('Re: ', '') : ''}
                phaseId={phaseId}
                isPending={isPending}
                isPendingPostForModerator={isPendingPostForModerator}
                isMultiColumns={multiColumns}
                isDebateModerated={isDebateModerated}
              />
            </div>
          </div>
          {canReply && !isPending ? (
            <div className={this.state.showAnswerForm ? 'answer-form' : 'collapsed-answer-form'}>
              <AnswerForm
                parentId={id}
                ideaId={ideaId}
                refetchIdea={refetchIdea}
                textareaRef={answerTextareaRef}
                hideAnswerForm={this.hideAnswerForm}
                handleAnswerClick={this.handleAnswerClick}
                phaseId={phaseId}
                routerParams={routerParams}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

export default PostView;