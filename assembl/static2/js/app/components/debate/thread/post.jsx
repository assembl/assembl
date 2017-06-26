import React from 'react';

import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import ProfileLine from '../../common/profileLine';

export default class Post extends React.Component {
  render() {
    const { subject, body, parentId, indirectIdeaContentLinks, mySentiment, sentimentCounts, creator, creationDate } = this.props;
    return (
      <div className="theme-box" style={{ marginTop: '2em' }}>
        <p>
          <ProfileLine userId={creator.userId} userName={creator.name} />
          <span>{creationDate}</span> {/* TODO convert this to "x months ago" with momentjs */}
        </p>
        <p>{parentId !== null ? <span>Rep. 1 :</span> : null}{subject}</p>
        <p>{body}</p>
        <div>
          Post relatif aux thématiques suivantes :
          {indirectIdeaContentLinks.map((link) => {
            return <span className="badge" key={link.idea.id}>{link.idea.title}</span>;
          })}
        </div>
        <span className="assembl-icon-share" /> {/* TODO should be a answer icon */}
        <span className="assembl-icon-share" />
        <div className="sentiments">
          <div className={mySentiment === 'LIKE' ? 'sentiment sentiment-active' : 'sentiment'}>
            <Like size={15} />&nbsp;<span className="txt">{sentimentCounts.like}</span>
          </div>
          <div className={mySentiment === 'DISAGREE' ? 'sentiment sentiment-active' : 'sentiment'}>
            <Disagree size={15} />&nbsp;<span className="txt">{sentimentCounts.disagree}</span>
          </div>
          <div className={mySentiment === 'DONT_UNDERSTAND' ? 'sentiment sentiment-active' : 'sentiment'}>
            <Disagree size={15} />&nbsp;<span className="txt">{sentimentCounts.dontUnderstand}</span>{' '}
            {/* TODO DontUnderstand svg  */}
          </div>
          <div className={mySentiment === 'MORE_INFO' ? 'sentiment sentiment-active' : 'sentiment'}>
            <Disagree size={15} />&nbsp;<span className="txt">{sentimentCounts.moreInfo}</span>
            {/* TODO MoreInfo svg  */}
          </div>
          <div>
            {/* TODO icon x reactions  */}
            <Disagree size={15} />&nbsp;<span className="txt">
              {sentimentCounts.like + sentimentCounts.disagree + sentimentCounts.dontUnderstand + sentimentCounts.moreInfo}{' '}
              réactions
            </span>
          </div>
        </div>
        <p>x réponses à ce post</p>
      </div>
    );
  }
}