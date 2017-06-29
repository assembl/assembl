import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Row, Col } from 'react-bootstrap';
import { createSelector } from 'reselect';

import { postSelector } from '../../../selectors';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import DontUnderstand from '../../svg/dontUnderstand';
import MoreInfo from '../../svg/moreInfo';
import ProfileLine from '../../common/profileLine';

const postMapStateToProps = createSelector(postSelector, (post) => {
  return { expanded: post.get('showResponses', false) };
});

export const connectPostToState = connect(postMapStateToProps);

export const PostFolded = ({ creator }) => {
  return <a><Translate value="debate.thread.foldedPostLink" creatorName={creator.name} /></a>;
};

export default class Post extends React.Component {
  render() {
    const { subject, body, parentId, indirectIdeaContentLinks, mySentiment, sentimentCounts, creator, creationDate } = this.props;
    let count = 1;
    const totalSentimentsCount =
      sentimentCounts.like + sentimentCounts.disagree + sentimentCounts.dontUnderstand + sentimentCounts.moreInfo;
    return (
      <div className="posts">
        <div className="box">
          <Row className="post-row">
            <Col xs={12} md={11} className="post-left">
              <ProfileLine userId={creator.userId} userName={creator.name} creationDate={creationDate} />
              {/* TODO convert creationDate to "x months ago" with momentjs */}
              <h3 className="dark-title-3">{parentId !== null ? <span>Rep. 1 :</span> : null}{subject}</h3>
              <div className="body">{body}</div>
              <div className="link-idea">
                <div className="label"><Translate value="debate.thread.linkIdea" /></div>
                <div className="badges">
                  {indirectIdeaContentLinks.map((link) => {
                    return <span className="badge" key={link.idea.id}>{link.idea.title}</span>;
                  })}
                </div>
              </div>
              <div className="annotation">x réponses à ce post</div>
              {/* TODO */}
            </Col>
            <Col xs={12} md={1} className="post-right">
              <div className="assembl-icon-back-arrow color pointer" />
              <div className="assembl-icon-share color margin-s pointer" />
              <div className="margin-s">
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
                <div className="sentiments-count margin-m">
                  {Object.keys(sentimentCounts).map((sentiment, index) => {
                    if (parseFloat(sentimentCounts[sentiment]) > 0 && sentiment === 'like') {
                      return (
                        <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                          <Like size={15} />
                        </div>
                      );
                    }
                    if (parseFloat(sentimentCounts[sentiment]) > 0 && sentiment === 'disagree') {
                      return (
                        <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                          <Disagree size={15} />
                        </div>
                      );
                    }
                    if (parseFloat(sentimentCounts[sentiment]) > 0 && sentiment === 'dontUnderstand') {
                      return (
                        <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                          <DontUnderstand size={15} />
                        </div>
                      );
                    }
                    if (parseFloat(sentimentCounts[sentiment]) > 0 && sentiment === 'moreInfo') {
                      return (
                        <div className="min-sentiment" key={index} style={{ left: `${(count += 1 * 6)}px` }}>
                          <MoreInfo size={15} />
                        </div>
                      );
                    }
                    return null;
                  })}
                  {totalSentimentsCount > 0 &&
                    <div className="txt" style={{ marginLeft: `${(count += 1 * 6)}px` }}>
                      {totalSentimentsCount}
                    </div>}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}