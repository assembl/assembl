// @flow
import * as React from 'react';
import truncate from 'lodash/truncate';
import { Col } from 'react-bootstrap';
import classnames from 'classnames';
import debounce from 'lodash/debounce';

import IdeaPreview from './ideaPreview';
import { get as getRoute } from '../../../utils/routeMap';
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import { APP_CONTAINER_PADDING } from '../../../constants';

type Props = {
  ideas: Array<Idea>,
  identifier: string,
  phaseId: string,
  ideaLevel: number,
  nbLevel: number,
  selectedIdeasId: Array<string>,
  setSelectedIdeas: Function
};

type State = {
  sliderWidth: number,
  previewWidth: number,
  thumbnailsSliderWidth: number,
  thumbnailsWidth: number
};

class IdeasLevelMobile extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { ideas } = this.props;
    this.state = {
      sliderWidth: window.innerWidth * 0.8 * ideas.length,
      thumbnailsSliderWidth: (window.innerWidth * 0.6 + APP_CONTAINER_PADDING) * ideas.length - APP_CONTAINER_PADDING,
      previewWidth: window.innerWidth * 0.8,
      thumbnailsWidth: window.innerWidth * 0.6
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = debounce(() => {
    const { ideas } = this.props;
    this.setState({
      sliderWidth: window.innerWidth * 0.8 * ideas.length,
      thumbnailsSliderWidth: (window.innerWidth * 0.6 + APP_CONTAINER_PADDING) * ideas.length - APP_CONTAINER_PADDING,
      previewWidth: window.innerWidth * 0.8,
      thumbnailsWidth: window.innerWidth * 0.6
    });
  }, 100);

  render() {
    const { ideas, identifier, phaseId, ideaLevel, nbLevel, selectedIdeasId, setSelectedIdeas } = this.props;
    const { sliderWidth, thumbnailsSliderWidth, previewWidth, thumbnailsWidth } = this.state;
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
        style={isSubLevel ? { height: '140px' } : null}
        id={`slider-${ideaLevel}`}
      >
        <div
          className={classnames('slider', { 'thumbnails-slider': isSubLevel })}
          style={isSubLevel ? { width: thumbnailsSliderWidth } : { width: sliderWidth }}
        >
          {ideas.map((idea, index) => (
            <Col
              style={isSubLevel ? { width: thumbnailsWidth, height: '110px' } : { width: previewWidth }}
              className="theme theme-inline"
              xs={12}
              md={12}
              sm={12}
              key={`ideas-level-mob-${index}`}
            >
              <div className="left">
                <IdeaPreview
                  imgUrl={idea.img ? idea.img.externalUrl : ''}
                  messageViewOverride={idea.messageViewOverride}
                  numPosts={idea.numPosts}
                  numContributors={idea.numContributors}
                  numVotes={idea.numVotes}
                  numChildren={idea.numChildren}
                  link={`${getRoute('idea', { slug: slug, phase: identifier, phaseId: phaseId, themeId: idea.id })}`}
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
                  ideaPreviewWidth={window.innerWidth * 0.6}
                />
              </div>
            </Col>
          ))}
        </div>
      </div>
    );
  }
}

export default IdeasLevelMobile;