import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Row, Col } from 'react-bootstrap';
import { createSelector } from 'reselect';

import { updateActiveAnswerFormId } from '../../../actions/postsActions';
import { postSelector } from '../../../selectors';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import DontUnderstand from '../../svg/dontUnderstand';
import MoreInfo from '../../svg/moreInfo';
import ProfileLine from '../../common/profileLine';
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
  mySentiment,
  sentimentCounts,
  creator,
  creationDate,
  showAnswerForm,
  activeAnswerFormId,
  ideaId,
  refetchIdea
}) => {
  let count = 0;
  const totalSentimentsCount =
    sentimentCounts.like + sentimentCounts.disagree + sentimentCounts.dontUnderstand + sentimentCounts.moreInfo;

  const handleAnswerClick = () => {
    showAnswerForm(id);
  };
  return (
    <div className="posts">
      <div className="box">
        <Row className="post-row">
          <Col xs={12} md={11} className="post-left">
            <ProfileLine userId={creator.userId} userName={creator.name} creationDate={creationDate} />
            <h3 className="dark-title-3">{subject}</h3>
            <div className="body">{body}</div>
            <div className="link-idea">
              <div className="label"><Translate value="debate.thread.linkIdea" /></div>
              <div className="badges">
                {indirectIdeaContentLinks.map((link) => {
                  return <span className="badge" key={link.idea.id}>{link.idea.title}</span>;
                })}
              </div>
            </div>
            <div className="answers annotation">
              <Translate value="debate.thread.numberOfResponses" count={children.length} />
            </div>
          </Col>
          <Col xs={12} md={1} className="post-right">
            <div className="post-icons">
              <div className="post-action" onClick={handleAnswerClick}>
                <span className="assembl-icon-back-arrow color" />
              </div>
              <div className="post-action">
                <span className="assembl-icon-share color" />
              </div>
              <div className="add-sentiment">
                <div className={mySentiment === 'LIKE' ? 'sentiment sentiment-active' : 'sentiment'}>
                  <Like size={25} />
                </div>
                <div className={mySentiment === 'DISAGREE' ? 'sentiment sentiment-active' : 'sentiment'}>
                  <Disagree size={25} />
                </div>
                <div className={mySentiment === 'DONT_UNDERSTAND' ? 'sentiment sentiment-active' : 'sentiment'}>
                  <DontUnderstand size={25} />
                </div>
                <div className={mySentiment === 'MORE_INFO' ? 'sentiment sentiment-active' : 'sentiment'}>
                  <MoreInfo size={25} />
                </div>
              </div>
            </div>
            {totalSentimentsCount > 0 &&
              <div className="sentiments-count margin-m">
                <div>
                  <div>
                    {Object.keys(sentimentCounts).map((sentiment, index) => {
                      if (sentimentCounts[sentiment] > 0 && sentiment === 'like') {
                        return (
                          <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                            <Like size={15} />
                          </div>
                        );
                      }
                      if (sentimentCounts[sentiment] > 0 && sentiment === 'disagree') {
                        return (
                          <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                            <Disagree size={15} />
                          </div>
                        );
                      }
                      if (sentimentCounts[sentiment] > 0 && sentiment === 'dontUnderstand') {
                        return (
                          <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                            <DontUnderstand size={15} />
                          </div>
                        );
                      }
                      if (sentimentCounts[sentiment] > 0 && sentiment === 'moreInfo') {
                        return (
                          <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                            <MoreInfo size={15} />
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
                <div className="txt">
                  {totalSentimentsCount}
                </div>
              </div>}
            <div className="answers annotation">
              <Translate value="debate.thread.numberOfResponses" count={children.length} />
            </div>
            <div className="clear">&nbsp;</div>
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