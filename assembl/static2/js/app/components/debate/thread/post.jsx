import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { Row, Col } from 'react-bootstrap';
import { createSelector } from 'reselect';
import { EditorState } from 'draft-js';

import { updateActiveAnswerFormId, updateAnswerPostBody } from '../../../actions/postsActions';
import { postSelector } from '../../../selectors';
import { getDomElementOffset, scrollToPosition } from '../../../utils/globalFunctions';
import ProfileLine from '../../common/profileLine';
import PostActions from './postActions';
import { SHOW_POST_RESPONSES } from '../../../constants';
import AnswerForm from './answerForm';
import PostQuery from '../../../graphql/PostQuery.graphql';
import withLoadingIndicator from '../../../components/common/withLoadingIndicator';

const postMapStateToProps = createSelector(postSelector, (post) => {
  return { expanded: post.get('showResponses', SHOW_POST_RESPONSES) };
});

export const connectPostToState = connect(postMapStateToProps);

export const PostFolded = ({ nbPosts }) => {
  return <Translate value="debate.thread.foldedPostLink" count={nbPosts} />;
};

let answerTextarea = null;
class Post extends React.Component {
  componentDidMount() {
    if (this.props.measureTreeHeight) {
      this.props.measureTreeHeight();
    }
  }

  handleAnswerClick = () => {
    this.props.updateAnswerBody(EditorState.createEmpty());
    this.props.showAnswerForm(this.props.id);
    setTimeout(() => {
      const txtareaOffset = getDomElementOffset(answerTextarea).top;
      scrollToPosition(txtareaOffset - answerTextarea.clientHeight, 200);
    }, 200);
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
    const { activeAnswerFormId } = this.props;
    const answerTextareaRef = (el) => {
      answerTextarea = el;
    };
    return (
      <div className="posts" id={id}>
        <div className="box">
          <Row className="post-row">
            <Col xs={12} md={11} className="post-left">
              {creator && <ProfileLine userId={creator.userId} userName={creator.name} creationDate={creationDate} />}
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

const mapStateToProps = ({ posts }) => {
  return {
    activeAnswerFormId: posts.activeAnswerFormId
  };
};

export default compose(connect(mapStateToProps, mapDispatchToProps), graphql(PostQuery), withLoadingIndicator())(Post);