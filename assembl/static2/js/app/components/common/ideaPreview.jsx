import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import Statistic from './statistic';

const IdeaPreview = ({
  imgUrl,
  link,
  title,
  description,
  numPosts,
  numContributors,
  numChildren,
  isSelected,
  setLevelsToDisplay,
  ideaId,
  ideaLevel
}) => {
  const imageBoxStyle = {};
  if (imgUrl) {
    imageBoxStyle.backgroundImage = `url(${imgUrl})`;
  }
  return (
    <div
      className={
        isSelected
          ? `illustration illustration-box idea-preview idea-preview-selected idea-preview-level-${ideaLevel}`
          : `illustration illustration-box idea-preview idea-preview-level-${ideaLevel}`
      }
    >
      <div className="image-box" style={imageBoxStyle} />
      <div className="content-box" to={link}>
        <h3 className="light-title-3 center">
          {title}
        </h3>
        <div className="see-discussion">
          <Link to={link}>
            <Translate value="debate.thread.goToIdea" />
          </Link>
        </div>
        {numChildren
          ? <div>
            <div className="action-separator" />
            <div
              className="see-sub-ideas"
              onClick={() => {
                setLevelsToDisplay(ideaId, ideaLevel);
              }}
            >
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
};

export default IdeaPreview;