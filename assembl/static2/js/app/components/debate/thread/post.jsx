import React from 'react';
import { Translate } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';

import { getDomElementOffset } from '../../../utils/globalFunctions';
import Attachments from '../../common/attachments';
import ProfileLine from '../../common/profileLine';
import PostTranslate from '../common/translations/postTranslate';
import PostActions from '../common/postActions';
import AnswerForm from './answerForm';
import EditPostForm from '../common/editPostForm';
import DeletedPost from '../common/deletedPost';
import PostQuery from '../../../graphql/PostQuery.graphql';
import withLoadingIndicator from '../../../components/common/withLoadingIndicator';
import { DeletedPublicationStates, PublicationStates } from '../../../constants';
import Nuggets from './nuggets';
import hashLinkScroll from '../../../utils/hashLinkScroll';
import { transformLinksInHtml } from '../../../utils/linkify';

export const PostFolded = ({ nbPosts }) => <Translate value="debate.thread.foldedPostLink" count={nbPosts} />;

const getSubjectPrefixString = fullLevel =>
  fullLevel && (
    <span className="subject-prefix">
      {`Rep. ${fullLevel
        .split('-')
        .map(level => `${Number(level) + 1}`)
        .join('.')}: `}
    </span>
  );

// TODO we need a graphql query to retrieve all languages with native translation, see Python langstrings.LocaleLabel
// We only have french and english for en, fr, ja for now.

export class EmptyPost extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showAnswerForm: false,
      mode: 'view'
    };
  }

  componentDidMount() {
    this.props.measureTreeHeight(400);
    // If we have a hash in url and the post id match it, scroll to it.
    const postId = this.props.data.post.id;
    const { hash } = window.location;
    if (hash !== '') {
      const id = hash.replace('#', '').split('?')[0];
      if (id === postId) {
        // Wait an extra 1s to be sure that all previous posts are loaded
        // and measureTreeHeight finished.
        setTimeout(hashLinkScroll, 1000);
      }
    }
  }

  componentDidUpdate(prevProps) {
    const { body } = this.getBodyAndSubject();
    if (body && body.indexOf('<img src')) {
      this.props.measureTreeHeight(200);
    }

    if (this.props.lang !== prevProps.lang || this.props.data.post.publicationState !== prevProps.data.post.publicationState) {
      this.props.measureTreeHeight(200);
    }
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

  handleEditClick = () => {
    this.setState({ mode: 'edit' }, this.props.measureTreeHeight);
  };

  goBackToViewMode = () => {
    this.setState({ mode: 'view' }, this.props.measureTreeHeight);
  };

  getBodyAndSubject = (translate) => {
    const { subjectEntries, bodyEntries } = this.props.data.post;

    let body;
    let subject;
    let originalBody;
    let originalSubject;
    if (bodyEntries.length > 1) {
      // first entry is the translated version, example localeCode "fr-x-mtfrom-en"
      // second entry is the original, example localeCode "en"
      body = translate ? bodyEntries[0].value : bodyEntries[1].value;
      originalBody = bodyEntries[1].value;
    } else {
      // translation is not enabled or the message is already in the desired locale
      body = bodyEntries[0].value;
      originalBody = bodyEntries[0].value;
    }
    if (subjectEntries.length > 1) {
      subject = translate ? subjectEntries[0].value : subjectEntries[1].value;
      originalSubject = subjectEntries[1].value;
    } else {
      subject = subjectEntries[0].value;
      originalSubject = subjectEntries[0].value;
    }

    return {
      body: body,
      subject: subject,
      originalBody: originalBody,
      originalSubject: originalSubject
    };
  };

  recomputeTreeHeightOnImagesLoad = (el) => {
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
      id,
      bodyMimeType,
      indirectIdeaContentLinks,
      creator,
      modificationDate,
      sentimentCounts,
      mySentiment,
      publicationState,
      attachments,
      extracts
    } = this.props.data.post;
    const {
      contentLocale,
      lang,
      ideaId,
      refetchIdea,
      creationDate,
      fullLevel,
      numChildren,
      routerParams,
      debateData,
      nuggetsManager,
      rowIndex,
      originalLocale,
      identifier
    } = this.props;
    // creationDate is retrieved by IdeaWithPosts query, not PostQuery
    const translate = contentLocale !== originalLocale;
    const { body, subject, originalBody, originalSubject } = this.getBodyAndSubject(translate);

    const relatedIdeasTitle = indirectIdeaContentLinks.map(link => link.idea.title);

    const modifiedSubject = (
      <span>
        {getSubjectPrefixString(fullLevel)}
        {subject.replace('Re: ', '')}
      </span>
    );
    const modifiedOriginalSubject = (
      <span>
        {getSubjectPrefixString(fullLevel)}
        {originalSubject && originalSubject.replace('Re: ', '')}
      </span>
    );

    if (publicationState in DeletedPublicationStates) {
      return (
        <DeletedPost
          id={id}
          subject={modifiedSubject}
          deletedBy={publicationState === PublicationStates.DELETED_BY_USER ? 'user' : 'admin'}
        />
      );
    }

    if (this.state.mode === 'edit') {
      return (
        <div className="posts">
          <div className="answer-form" id={id}>
            <EditPostForm
              id={id}
              body={originalBody}
              subject={originalSubject}
              refetchIdea={refetchIdea}
              goBackToViewMode={this.goBackToViewMode}
              readOnly={!!this.props.parentId}
              modifiedOriginalSubject={modifiedOriginalSubject}
              originalLocale={originalLocale}
            />
          </div>
        </div>
      );
    }

    const completeLevelArray = fullLevel ? [rowIndex, ...fullLevel.split('-').map(string => Number(string))] : [rowIndex];

    const answerTextareaRef = (el) => {
      this.answerTextarea = el;
    };

    return (
      <div className="posts" id={id}>
        <Nuggets extracts={extracts} postId={id} nuggetsManager={nuggetsManager} completeLevel={completeLevelArray.join('-')} />
        <div className="box">
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
              {debateData.translationEnabled ? (
                <PostTranslate
                  contentLocale={contentLocale}
                  id={id}
                  lang={lang}
                  originalLocale={originalLocale}
                  translate={translate}
                />
              ) : null}
              <h3 className="dark-title-3">{modifiedSubject}</h3>
              <div
                className={`body ${bodyMimeType === 'text/plain' ? 'pre-wrap' : ''}`}
                dangerouslySetInnerHTML={{ __html: transformLinksInHtml(body) }}
                ref={this.recomputeTreeHeightOnImagesLoad}
              />

              <Attachments attachments={attachments} />

              {relatedIdeasTitle.length ? (
                <div className="link-idea">
                  <div className="label">
                    <Translate value="debate.thread.linkIdea" />
                  </div>
                  <div className="badges">
                    {relatedIdeasTitle.map((title, index) => (
                      <span className="badge" key={index}>
                        {title}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="answers annotation">
                <Translate value="debate.thread.numberOfResponses" count={numChildren} />
              </div>
            </div>
            <div className="post-right">
              <PostActions
                creatorUserId={creator.userId}
                postId={id}
                handleEditClick={this.handleEditClick}
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
      </div>
    );
  }
}

export default compose(graphql(PostQuery), withLoadingIndicator())(EmptyPost);