import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Row, Col } from 'react-bootstrap';
import { createSelector } from 'reselect';

import { updateActiveAnswerFormId } from '../../../actions/postsActions';
import { postSelector } from '../../../selectors';
import { getDomElementOffset, scrollToPosition } from '../../../utils/globalFunctions';
import ProfileLine from '../../common/profileLine';
import PostActions from './postActions';
import { SHOW_POST_RESPONSES } from '../../../constants';
import AnswerForm from './answerForm';

const postMapStateToProps = createSelector(postSelector, (post) => {
  return { expanded: post.get('showResponses', SHOW_POST_RESPONSES) };
});

export const connectPostToState = connect(postMapStateToProps);

export const PostFolded = ({ creator }) => {
  return <Translate value="debate.thread.foldedPostLink" creatorName={creator.name} />;
};

const Post = ({
  id,
  children,
  subject,
  body,
  indirectIdeaContentLinks,
  creator,
  creationDate,
  showAnswerForm,
  activeAnswerFormId,
  ideaId,
  refetchIdea,
  sentimentCounts,
  mySentiment
}) => {
  const handleAnswerClick = () => {
    showAnswerForm(id);
    setTimeout(() => {
      const txtarea = document.getElementById(id);
      const txtareaOffset = getDomElementOffset(txtarea).top;
      scrollToPosition(txtareaOffset - txtarea.clientHeight, 600);
      txtarea.focus();
    }, 500);
  };
  return (
    <div className="posts">
      <div className="box">
        <Row className="post-row">
          <Col xs={12} md={11} className="post-left">
            {creator && <ProfileLine userId={creator.userId} userName={creator.name} creationDate={creationDate} />}
            <h3 className="dark-title-3">{subject}</h3>
            <div className="body">{body}</div>
            <div className="link-idea">
              <div className="label"><Translate value="debate.thread.linkIdea" /></div>
              <div className="badges">
                {indirectIdeaContentLinks &&
                  indirectIdeaContentLinks.map((link) => {
                    return <span className="badge" key={link.idea.id}>{link.idea.title}</span>;
                  })}
              </div>
            </div>
            <div className="answers annotation">
              <Translate value="debate.thread.numberOfResponses" count={children ? children.length : 0} />
            </div>
          </Col>
          <Col xs={12} md={1} className="post-right">
            <PostActions
              handleAnswerClick={handleAnswerClick}
              sentimentCounts={sentimentCounts}
              mySentiment={mySentiment}
              postChildren={children}
            />
          </Col>
        </Row>
      </div>
      {activeAnswerFormId === id
        ? <div className="answer-form"><AnswerForm parentId={id} ideaId={ideaId} refetchIdea={refetchIdea} /></div>
        : null}
    </div>
  );
};

const mapDispatchToProps = (dispatch) => {
  return {
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

export default connect(mapStateToProps, mapDispatchToProps)(Post);