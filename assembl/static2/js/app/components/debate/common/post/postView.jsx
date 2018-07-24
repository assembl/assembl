// @flow
import * as React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { getDomElementOffset, elementContainsSelection } from '../../../../utils/globalFunctions';
import Attachments from '../../../common/attachments';
import ProfileLine from '../../../common/profileLine';
import PostActions from '../../common/postActions';
import AnswerForm from '../../thread/answerForm';
import Nuggets from '../../thread/nuggets';
import RelatedIdeas from './relatedIdeas';
import PostBody from './postBody';
import HarvestingMenu from '../../../harvesting/harvestingMenu';
import type { Props as PostProps } from './index';

type Props = PostProps & {
  body: string,
  handleEditClick: Function,
  isHarvesting: boolean,
  modifiedSubject: React.Element<any>,
  multiColumns: boolean,
  subject: string,
  timeline: Timeline
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
    const isSelectionInBody = elementContainsSelection(document.getElementById(`message-body-local:Content/${dbId}`));
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
      bodyMimeType,
      dbId,
      indirectIdeaContentLinks,
      creator,
      modified,
      sentimentCounts,
      mySentiment,
      attachments,
      extracts
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
      identifier,
      body,
      subject,
      modifiedSubject,
      multiColumns,
      isHarvesting,
      timeline
    } = this.props;
    const translate = contentLocale !== originalLocale;

    const completeLevelArray = fullLevel ? [rowIndex, ...fullLevel.split('-').map(string => Number(string))] : [rowIndex];

    const answerTextareaRef = (el: ?HTMLTextAreaElement) => {
      this.answerTextarea = el;
    };

    const boxStyle = {
      borderLeftColor: borderLeftColor
    };

    let canReply = !multiColumns;
    // If we're in thread mode, check if the first idea associated to the post is multi columns.
    if (!multiColumns && indirectIdeaContentLinks && indirectIdeaContentLinks.length > 0) {
      canReply = indirectIdeaContentLinks[0].idea.messageViewOverride !== 'messageColumns';
    }

    const { displayHarvestingAnchor, displayHarvestingBox, harvestingAnchorPosition } = this.state;

    const { refetch } = this.props.data;

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
          />
        )}
        <div className="box" style={boxStyle}>
          <div className="post-row">
            <div className="post-left">
              {creator && (
                <ProfileLine
                  userId={creator.userId}
                  userName={creator.isDeleted ? I18n.t('deletedUser') : creator.displayName}
                  creationDate={creationDate}
                  locale={lang}
                  modified={modified}
                />
              )}
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
              />

              <Attachments attachments={attachments} />

              {!multiColumns && (
                <div>
                  <RelatedIdeas indirectIdeaContentLinks={indirectIdeaContentLinks} />

                  <div className="answers annotation">
                    <Translate value="debate.thread.numberOfResponses" count={numChildren} />
                  </div>
                </div>
              )}
            </div>
            <div className="post-right">
              <PostActions
                creatorUserId={creator.userId}
                postId={id}
                handleEditClick={handleEditClick}
                sentimentCounts={sentimentCounts}
                mySentiment={mySentiment}
                numChildren={numChildren}
                routerParams={routerParams}
                debateData={debateData}
                postSubject={subject.replace('Re: ', '')}
                identifier={identifier}
                timeline={timeline}
              />
            </div>
          </div>
        </div>
        {canReply && (
          <div className={this.state.showAnswerForm ? 'answer-form' : 'collapsed-answer-form'}>
            <AnswerForm
              parentId={id}
              ideaId={ideaId}
              refetchIdea={refetchIdea}
              textareaRef={answerTextareaRef}
              hideAnswerForm={this.hideAnswerForm}
              handleAnswerClick={this.handleAnswerClick}
              identifier={identifier}
            />
          </div>
        )}
      </div>
    );
  }
}

export default PostView;