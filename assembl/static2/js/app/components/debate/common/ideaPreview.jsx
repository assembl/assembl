import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import Statistic from '../../common/statistic';

const IdeaPreview = ({
  selectedIdeasId,
  imgUrl,
  link,
  title,
  numPosts,
  numContributors,
  numChildren,
  setSelectedIdeas,
  ideaId,
  ideaLevel,
  ideaIndex
}) => (
  <div
    className={
      selectedIdeasId.indexOf(ideaId) > -1
        ? `illustration-box idea-preview idea-preview-level-${ideaLevel} idea-preview-selected`
        : `illustration-box idea-preview idea-preview-level-${ideaLevel}`
    }
  >
    <div className="image-box" style={imgUrl ? { backgroundImage: `url(${imgUrl})` } : null} />
    <div className="content-box" to={link}>
      <h3 className="light-title-3 center">{title}</h3>
      <div className="access-discussion">
        <div className="see-discussion">
          <Link to={link}>
            <Translate value="debate.thread.goToIdea" />
          </Link>
        </div>
        {numChildren ? (
          <div>
            <div>/</div>
            <div
              className="see-sub-ideas"
              onClick={() => {
                setSelectedIdeas(ideaId, ideaLevel, ideaIndex);
                const scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
                const scrollValue = scrollPosition + 500;
                setTimeout(() => {
                  window.scrollTo({ top: scrollValue, left: 0, behavior: 'smooth' });
                }, 500);
              }}
            >
              <Translate value="debate.thread.seeSubIdeas" count={numChildren} />
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>
      <div className="selected-idea-arrow">
        <span className="assembl-icon-down-open" />
      </div>
      <Statistic numPosts={numPosts} numContributors={numContributors} />
    </div>
    <div className="color-box">&nbsp;</div>
    <div className="box-hyphen">&nbsp;</div>
    <div className="box-hyphen rotate-hyphen">&nbsp;</div>
  </div>
);

export default IdeaPreview;