// @flow

import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';
import Statistic from '../../common/statistic';
import { APP_CONTAINER_PADDING, MESSAGE_VIEW } from '../../../constants';

type Props = {
  selectedIdeasId: Array<string>,
  imgUrl: string,
  link: string,
  title: string,
  messageViewOverride: string,
  numPosts: number,
  numContributors: number,
  numChildren: number,
  ideaId: string,
  ideaLevel: number,
  ideaIndex: number,
  nbLevel?: number,
  isMobile: boolean,
  ideaPreviewWidth: number,
  setSelectedIdeas: Function
};

const IdeaPreview = ({
  selectedIdeasId,
  imgUrl,
  link,
  title,
  messageViewOverride,
  numPosts,
  numContributors,
  numChildren,
  ideaId,
  ideaLevel,
  ideaIndex,
  nbLevel,
  setSelectedIdeas,
  isMobile,
  ideaPreviewWidth
}: Props) => {
  const previewClasses = classnames('idea-preview', `idea-preview-level-${ideaLevel}`, {
    'idea-preview-selected': selectedIdeasId.indexOf(ideaId) > -1,
    'idea-preview-thumbnails': nbLevel && nbLevel > 1 && ideaLevel < nbLevel,
    'illustration-box': !isMobile,
    'mobile-illustration-box': isMobile
  });
  return (
    <div className={previewClasses}>
      <div className="image-box" style={imgUrl ? { backgroundImage: `url(${imgUrl})` } : null} />
      <div className="content-box position-content-box" to={link}>
        <h3 className={classnames('light-title-3', 'center', { ellipsis: isMobile && nbLevel && ideaLevel < nbLevel })}>
          {title}
        </h3>
        <div className="access-discussion">
          {numChildren ? (
            <div>
              <div
                className="see-sub-ideas"
                onClick={() => {
                  if (isMobile) {
                    setSelectedIdeas(ideaId, ideaLevel, ideaIndex);
                    const slider = document.getElementById(`slider-${ideaLevel}`);
                    if (slider) {
                      slider.scrollLeft =
                        (ideaPreviewWidth + APP_CONTAINER_PADDING) * ideaIndex -
                        (ideaPreviewWidth + APP_CONTAINER_PADDING * 2 - window.innerWidth / 2);
                    }
                    setTimeout(() => {
                      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                    }, 500);
                  } else {
                    setSelectedIdeas(ideaId, ideaLevel, ideaIndex);
                    const dScrollTop = document.documentElement ? document.documentElement.scrollTop : null;
                    const bScrollTop = document.body ? document.body.scrollTop : null;
                    const scrollPosition = dScrollTop || bScrollTop;
                    const scrollValue = scrollPosition + 500;
                    setTimeout(() => {
                      window.scrollTo({ top: scrollValue, left: 0, behavior: 'smooth' });
                    }, 500);
                  }
                }}
              >
                <Translate value="debate.thread.seeSubIdeas" count={numChildren} />
              </div>
              {messageViewOverride !== MESSAGE_VIEW.noModule ? <div>/</div> : null}
            </div>
          ) : (
            <div />
          )}
          {messageViewOverride !== MESSAGE_VIEW.noModule ? (
            <div className="see-discussion">
              <Link to={link}>
                {messageViewOverride === MESSAGE_VIEW.voteSession ? (
                  <Translate value="debate.thread.voteForProposals" />
                ) : (
                  <Translate value="debate.thread.goToIdea" />
                )}
              </Link>
            </div>
          ) : null}
        </div>
        <div className="selected-idea-arrow">
          <span className="assembl-icon-down-open" />
        </div>
        {messageViewOverride !== MESSAGE_VIEW.noModule && messageViewOverride !== MESSAGE_VIEW.voteSession ? (
          <Statistic numPosts={numPosts} numContributors={numContributors} />
        ) : null}
      </div>
      <div className="color-box">&nbsp;</div>
      <div className="box-hyphen">&nbsp;</div>
      <div className="box-hyphen rotate-hyphen">&nbsp;</div>
    </div>
  );
};

IdeaPreview.defaultProps = {
  nbLevel: null
};

export default IdeaPreview;