import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import Statistic from './statistic';

class IdeaPreview extends React.Component {
  render() {
    const { imgUrl, link, title, description, numPosts, numContributors, numChildren, isSelected, onSeeSubIdeasClick } = this.props;
    return (
      <div
        className={
          isSelected ? 'illustration illustration-box idea-preview idea-preview-selected' : 'illustration illustration-box idea-preview'
        }
      >
        <div className="image-box" style={{ backgroundImage: `url(${imgUrl})` }}>
          &nbsp;
        </div>
        <div className="content-box" to={link}>
          <h3 className="light-title-3 center">
            {title}
          </h3>
          <div className="see-discussion">
            <Link to={link}>
              <Translate value="debate.thread.goToIdea" />
            </Link>
          </div>
          {onSeeSubIdeasClick && numChildren
            ? <div>
              <div className="action-separator" />
              <div className="see-sub-ideas" onClick={onSeeSubIdeasClick}>
                <Translate value="debate.thread.seeSubIdeas" count={numChildren} />
              </div>
            </div>
            : <div />}
          <Statistic numPosts={numPosts} numContributors={numContributors} />
          <div className="text-box">
            {description}
          </div>
        </div>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

export default IdeaPreview;