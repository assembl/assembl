import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Row, Col } from 'react-bootstrap';

import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import ProfileLine from '../../common/profileLine';

export default class Post extends React.Component {
  render() {
    const { subject, body, parentId, indirectIdeaContentLinks, mySentiment, sentimentCounts, creator, creationDate } = this.props;
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
              <div className="assembl-icon-share" /> {/* TODO should be a answer icon */}
              <div className="assembl-icon-share" />
              <div>
                <div>
                  <Like size={15} />&nbsp;<span className="txt">{sentimentCounts.like}</span>
                </div>
                <div>
                  <Disagree size={15} />&nbsp;<span className="txt">{sentimentCounts.disagree}</span>
                </div>
                <div>
                  <Disagree size={15} />&nbsp;<span className="txt">{sentimentCounts.dontUnderstand}</span>{' '}
                  {/* TODO DontUnderstand svg  */}
                </div>
                <div>
                  <Disagree size={15} />&nbsp;<span className="txt">{sentimentCounts.moreInfo}</span>
                  {/* TODO MoreInfo svg  */}
                </div>
                <div>
                  {/* TODO icon x reactions  */}
                  <span className="txt">
                    {sentimentCounts.like + sentimentCounts.disagree + sentimentCounts.dontUnderstand + sentimentCounts.moreInfo}
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}