// @flow
import React from 'react';
import truncate from 'lodash/truncate';
import { Col } from 'react-bootstrap';
import classnames from 'classnames';
import IdeaPreview from './ideaPreview';
import { get as getRoute } from '../../../utils/routeMap';
import { getDiscussionSlug } from '../../../utils/globalFunctions';

type Props = {
  ideas: Array<Idea>,
  identifier: string,
  ideaLevel: number,
  nbLevel: number,
  selectedIdeasId: Array<string>,
  setSelectedIdeas: Function
};

const IdeasLevelMobile = ({ ideas, identifier, ideaLevel, nbLevel, selectedIdeasId, setSelectedIdeas }: Props) => {
  const slug = getDiscussionSlug();
  const isSubLevel = nbLevel > 1 && ideaLevel < nbLevel;
  const stringMaxLength = (level) => {
    switch (level) {
    case 1:
      return 80;
    case 2:
      return 50;
    case 3:
      return 30;
    default:
      return 30;
    }
  };
  return (
    <div
      className={classnames('slider-container', 'mobile-slider-container', {
        'thumbnails-mobile-slider': isSubLevel
      })}
      style={isSubLevel ? { height: '160px' } : null}
    >
      <div
        className={classnames('slider', { 'thumbnails-slider': isSubLevel })}
        style={
          isSubLevel
            ? { width: (window.innerWidth * 0.6 + 15) * ideas.length - 15 }
            : { width: window.innerWidth * 0.8 * ideas.length }
        }
      >
        {ideas.map((idea, index) => (
          <Col
            style={isSubLevel ? { width: window.innerWidth * 0.6, height: '130px' } : { width: window.innerWidth * 0.8 }}
            className="theme theme-inline"
            xs={12}
            md={12}
            sm={12}
            key={`ideas-level-mob-${index}`}
          >
            <div className="left">
              <IdeaPreview
                imgUrl={idea.img ? idea.img.externalUrl : ''}
                numPosts={idea.numPosts}
                numContributors={idea.numContributors}
                numChildren={idea.numChildren}
                link={`${getRoute('idea', { slug: slug, phase: identifier, themeId: idea.id })}`}
                title={truncate(idea.title, {
                  length: stringMaxLength(ideaLevel),
                  separator: ' ',
                  omission: '...'
                })}
                description={idea.description}
                ideaId={idea.id}
                ideaLevel={ideaLevel}
                selectedIdeasId={selectedIdeasId}
                ideaIndex={index}
                setSelectedIdeas={setSelectedIdeas}
                nbLevel={nbLevel}
                isMobile
              />
            </div>
          </Col>
        ))}
      </div>
    </div>
  );
};

export default IdeasLevelMobile;