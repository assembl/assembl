import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { Row, Col } from 'react-bootstrap';
import { EditorState } from 'draft-js';

import { updateActiveAnswerFormId, updateAnswerPostBody } from '../../../actions/postsActions';
import { getDomElementOffset, scrollToPosition } from '../../../utils/globalFunctions';
import ProfileLine from '../../common/profileLine';
import PostActions from './postActions';
import AnswerForm from './answerForm';
import PostQuery from '../../../graphql/PostQuery.graphql';
import withLoadingIndicator from '../../../components/common/withLoadingIndicator';

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
    if (this.props.activeAnswerFormId !== nextProps.activeAnswerFormId) {
      if (this.props.measureTreeHeight) {
        this.props.measureTreeHeight();
      }
    }
  }
  handleAnswerClick = () => {
    this.props.updateAnswerBody(EditorState.createEmpty());
    this.props.showAnswerForm(this.props.id);
    if (this.props.measureTreeHeight) {
      this.props.measureTreeHeight();
    }
    // setTimeout(() => {
    //   if (!this.answerTextarea) return;
    //   const txtareaOffset = getDomElementOffset(this.answerTextarea).top;
    //   scrollToPosition(txtareaOffset - this.answerTextarea.clientHeight, 200);
    // }, 2000);
  };

  render() {
    const {
      id,
      children,
      subject,
      body,
      indirectIdeaContentLinks,
      creator,
      creationDate,
      // modificationDate,
      bodyMimeType,
      ideaId,
      refetchIdea,
      sentimentCounts,
      mySentiment
    } = this.props.data.post;
    const { activeAnswerFormId, lang } = this.props;
    const answerTextareaRef = (el) => {
      this.answerTextarea = el;
    };
    return (
      <div className="posts" id={id}>
        <div className="box">
          <Row className="post-row">
            <Col xs={12} md={11} className="post-left">
              {creator && <ProfileLine userId={creator.userId} userName={creator.name} creationDate={creationDate} locale={lang} />}
              <h3 className="dark-title-3">
                {subject}
              </h3>
              <div className={`body ${bodyMimeType === 'text/plain' ? 'pre-wrap' : ''}`} dangerouslySetInnerHTML={{ __html: body }} />
              <div className="link-idea">
                <div className="label">
                  <Translate value="debate.thread.linkIdea" />
                </div>
                <div className="badges">
                  {indirectIdeaContentLinks &&
                    indirectIdeaContentLinks.map((link) => {
                      return (
                        <span className="badge" key={link.idea.id}>
                          {link.idea.title}
                        </span>
                      );
                    })}
                </div>
              </div>
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
        {activeAnswerFormId === id
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
    showAnswerForm: (activeAnswerFormId) => {
      return dispatch(updateActiveAnswerFormId(activeAnswerFormId));
    }
  };
};

export default compose(graphql(PostQuery), withLoadingIndicator(), connect(null, mapDispatchToProps))(Post);