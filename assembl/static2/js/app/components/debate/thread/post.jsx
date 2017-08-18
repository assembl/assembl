import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { Row, Col } from 'react-bootstrap';

import { updateActiveAnswerFormId, updateAnswerPostBody } from '../../../actions/postsActions';
import { createEmptyRawContentState } from '../../../utils/draftjs';
import { getDomElementOffset, scrollToPosition } from '../../../utils/globalFunctions';
import ProfileLine from '../../common/profileLine';
import PostActions from './postActions';
import AnswerForm from './answerForm';
import DeletedPost from './deletedPost';
import PostQuery from '../../../graphql/PostQuery.graphql';
import withLoadingIndicator from '../../../components/common/withLoadingIndicator';
import { DeletedPublicationStates, PublicationStates } from '../../../constants';

export const PostFolded = ({ nbPosts }) => {
  return <Translate value="debate.thread.foldedPostLink" count={nbPosts} />;
};

class Post extends React.Component {
  componentDidMount() {
    if (this.props.measureTreeHeight) {
      this.props.measureTreeHeight();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.needToShowAnswerForm !== nextProps.needToShowAnswerForm ||
      this.props.lang !== nextProps.lang ||
      this.props.data.post.publicationState !== nextProps.data.post.publicationState
    ) {
      if (this.props.measureTreeHeight) {
        this.props.measureTreeHeight();
      }
    }
    // Object.keys(nextProps).forEach((key) => {
    //   if (nextProps[key] !== this.props[key]) {
    //     console.log('prop changed', key);
    //   }
    // });
  }
  handleAnswerClick = () => {
    this.props.updateAnswerBody(createEmptyRawContentState());
    this.props.showAnswerForm(this.props.id);
    if (this.props.measureTreeHeight) {
      this.props.measureTreeHeight();
    }
    setTimeout(() => {
      if (!this.answerTextarea) return;
      const txtareaOffset = getDomElementOffset(this.answerTextarea).top;
      scrollToPosition(txtareaOffset - this.answerTextarea.clientHeight, 200);
    }, 200);
  };

  render() {
    const {
      id,
      children,
      subject,
      body,
      bodyMimeType,
      indirectIdeaContentLinks,
      creator,
      modificationDate,
      sentimentCounts,
      mySentiment,
      publicationState
    } = this.props.data.post;
    const { needToShowAnswerForm, lang, ideaId, refetchIdea, creationDate } = this.props;
    // creationDate is retrieved by IdeaWithPosts query, not PostQuery

    if (publicationState in DeletedPublicationStates) {
      return (
        <DeletedPost id={id} subject={subject} deletedBy={publicationState === PublicationStates.DELETED_BY_USER ? 'user' : 'admin'} />
      );
    }

    const answerTextareaRef = (el) => {
      this.answerTextarea = el;
    };
    return (
      <div className="posts" id={id}>
        <div className="box">
          <Row className="post-row">
            <Col xs={12} md={11} className="post-left">
              {creator &&
                <ProfileLine
                  userId={creator.userId}
                  userName={creator.name}
                  creationDate={creationDate}
                  locale={lang}
                  modified={modificationDate !== null}
                />}
              <h3 className="dark-title-3">
                {subject}
              </h3>
              <div className={`body ${bodyMimeType === 'text/plain' ? 'pre-wrap' : ''}`} dangerouslySetInnerHTML={{ __html: body }} />
              {indirectIdeaContentLinks.length
                ? <div className="link-idea">
                  <div className="label">
                    <Translate value="debate.thread.linkIdea" />
                  </div>
                  <div className="badges">
                    {indirectIdeaContentLinks.map((link) => {
                      return (
                        <span className="badge" key={link.idea.id}>
                          {link.idea.title}
                        </span>
                      );
                    })}
                  </div>
                </div>
                : null}
              <div className="answers annotation">
                <Translate value="debate.thread.numberOfResponses" count={children ? children.length : 0} />
              </div>
            </Col>
            <Col xs={12} md={1} className="post-right">
              <PostActions
                creatorUserId={creator.userId}
                postId={id}
                handleAnswerClick={this.handleAnswerClick}
                sentimentCounts={sentimentCounts}
                mySentiment={mySentiment}
                postChildren={children}
              />
            </Col>
          </Row>
        </div>
        {needToShowAnswerForm
          ? <div className="answer-form">
            <AnswerForm parentId={id} ideaId={ideaId} refetchIdea={refetchIdea} textareaRef={answerTextareaRef} />
          </div>
          : null}
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateAnswerBody: (body) => {
      return dispatch(updateAnswerPostBody(body));
    },
    showAnswerForm: (postId) => {
      return dispatch(updateActiveAnswerFormId(postId));
    }
  };
};

export default compose(connect(null, mapDispatchToProps), graphql(PostQuery), withLoadingIndicator())(Post);