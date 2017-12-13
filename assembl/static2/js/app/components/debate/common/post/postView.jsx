// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

import { getDomElementOffset } from '../../../../utils/globalFunctions';
import Attachments from '../../../common/attachments';
import ProfileLine from '../../../common/profileLine';
import PostActions from '../../common/postActions';
import AnswerForm from '../../thread/answerForm';
import Nuggets from '../../thread/nuggets';
import RelatedIdeas from './relatedIdeas';
import PostBody from './postBody';
import type { Props as PostProps } from './index';

type Props = PostProps & {
  body: string,
  subject: string,
  handleEditClick: Function,
  modifiedSubject: React.Element<*>
};

type State = {
  showAnswerForm: boolean
};

class PostView extends React.PureComponent<void, Props, State> {
  props: Props;

  state: State;

  answerTextarea: HTMLTextAreaElement;

  constructor(props: Props) {
    super(props);
    this.state = {
      showAnswerForm: false
    };
  }

  handleAnswerClick = () => {
    this.setState({ showAnswerForm: true }, this.props.measureTreeHeight);
    setTimeout(() => {
      if (!this.answerTextarea) return;
      const txtareaOffset = getDomElementOffset(this.answerTextarea).top;
      window.scrollTo({ top: txtareaOffset - this.answerTextarea.clientHeight, left: 0, behavior: 'smooth' });
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

  render() {
    const {
      bodyMimeType,
      indirectIdeaContentLinks,
      creator,
      modificationDate,
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
      editable,
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
      multiColumns
    } = this.props;
    const translate = contentLocale !== originalLocale;

    const completeLevelArray = fullLevel ? [rowIndex, ...fullLevel.split('-').map(string => Number(string))] : [rowIndex];

    const answerTextareaRef = (el: HTMLTextAreaElement) => {
      this.answerTextarea = el;
    };

    const boxStyle = {
      borderLeftColor: borderLeftColor
    };
    return (
      <div>
        <Nuggets extracts={extracts} postId={id} nuggetsManager={nuggetsManager} completeLevel={completeLevelArray.join('-')} />
        <div className="box" style={boxStyle}>
          <div className="post-row">
            <div className="post-left">
              {creator && (
                <ProfileLine
                  userId={creator.userId}
                  userName={creator.displayName}
                  creationDate={creationDate}
                  locale={lang}
                  modified={modificationDate !== null}
                />
              )}

              <PostBody
                body={body}
                bodyMimeType={bodyMimeType}
                contentLocale={contentLocale}
                id={id}
                lang={lang}
                subject={modifiedSubject}
                originalLocale={originalLocale}
                translate={translate}
                translationEnabled={debateData.translationEnabled}
                bodyDivRef={this.recomputeTreeHeightOnImagesLoad}
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
                editable={editable}
                postId={id}
                handleEditClick={handleEditClick}
                sentimentCounts={sentimentCounts}
                mySentiment={mySentiment}
                numChildren={numChildren}
                routerParams={routerParams}
                debateData={debateData}
                postSubject={subject.replace('Re: ', '')}
                identifier={identifier}
              />
            </div>
          </div>
        </div>
        {!multiColumns && (
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