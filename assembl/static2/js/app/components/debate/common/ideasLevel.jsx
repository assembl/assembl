import React from 'react';
import { Row, Col } from 'react-bootstrap';
import IdeaPreview from '../../common/ideaPreview';
import { get as getRoute } from '../../../utils/routeMap';
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import VisibilityComponent from '../../common/visibilityComponent';
import {
  APP_CONTAINER_MAX_WIDTH,
  IDEA_PREVIEW_MAX_WIDTH,
  IDEA_PREVIEW_MIN_WIDTH,
  NB_IDEA_PREVIEW_TO_SHOW,
  APP_CONTAINER_PADDING
} from '../../../constants';

class IdeasLevel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sliderCount: 0, sliderLeftPosition: 0 };
    this.getColClassNames = this.getColClassNames.bind(this);
    this.getIdeaPrewiewWidth = this.getIdeaPrewiewWidth.bind(this);
    this.getSliderLimitValue = this.getSliderLimitValue.bind(this);
    this.getSliderContainerWidth = this.getSliderContainerWidth.bind(this);
    this.getSliderRightOverflow = this.getSliderRightOverflow.bind(this);
    this.getLastMoveToRightValue = this.getLastMoveToRightValue.bind(this);
    this.handleClickArrowLeft = this.handleClickArrowLeft.bind(this);
    this.handleClickArrowRight = this.handleClickArrowRight.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    const { ideaLevel, nbLevel } = nextProps;
    const isCountShouldIncrease = ideaLevel < nbLevel;
    if (!isCountShouldIncrease) {
      this.setState({ sliderCount: 0, sliderLeftPosition: 0 });
    }
  }
  getColClassNames(index) {
    const { nbLevel } = this.props;
    this.index = index;
    let styles = 'theme';
    if (nbLevel <= 1) {
      if (this.index % 4 === 0) {
        styles += ' clear';
      }
      if (this.index <= 3) {
        styles += ` theme-first-row-${this.index % 4}`;
      } else {
        styles += ` theme-${this.index % 4}`;
      }
    } else {
      styles += ' theme-inline';
    }
    return styles;
  }
  getSliderContainerWidth() {
    let sliderContainerWidth = APP_CONTAINER_MAX_WIDTH + this.getSliderRightOverflow();
    if (window.innerWidth < APP_CONTAINER_MAX_WIDTH) {
      sliderContainerWidth = window.innerWidth - APP_CONTAINER_PADDING;
    }
    return sliderContainerWidth;
  }
  getIdeaPrewiewWidth() {
    this.ideaPreviewWidth = IDEA_PREVIEW_MAX_WIDTH;
    if (window.innerWidth < APP_CONTAINER_MAX_WIDTH) {
      this.ideaPreviewWidth = window.innerWidth / NB_IDEA_PREVIEW_TO_SHOW;
      if (this.ideaPreviewWidth < IDEA_PREVIEW_MIN_WIDTH) {
        this.ideaPreviewWidth = IDEA_PREVIEW_MIN_WIDTH;
      }
    }
    return this.ideaPreviewWidth;
  }
  getSliderRightOverflow() {
    this.availableRightSpace = (window.innerWidth - APP_CONTAINER_MAX_WIDTH) / 2;
    if (this.availableRightSpace > this.getIdeaPrewiewWidth() / 2) {
      this.availableRightSpace = this.getIdeaPrewiewWidth() / 2;
    }
    return this.availableRightSpace;
  }
  getLastMoveToRightValue() {
    let lastRightSpaceSize = this.getIdeaPrewiewWidth() - this.getSliderRightOverflow();
    if (window.innerWidth < APP_CONTAINER_MAX_WIDTH) {
      lastRightSpaceSize = this.getIdeaPrewiewWidth() - (this.getSliderContainerWidth() - this.getIdeaPrewiewWidth() * 4);
    }
    return lastRightSpaceSize;
  }
  getSliderLimitValue() {
    const { sliderLeftPosition } = this.state;
    const valueToReach = sliderLeftPosition + (this.getIdeaPrewiewWidth() - this.getLastMoveToRightValue() / 2);
    return valueToReach;
  }
  handleClickArrowLeft() {
    const { sliderCount, sliderLeftPosition } = this.state;
    let count = sliderCount;
    let left = sliderLeftPosition;
    if (count > 1) {
      count -= 1;
      this.setState({ sliderCount: count });
      const { ideas } = this.props;
      const totalIdeaPreviewWidth = ideas.length * this.getIdeaPrewiewWidth();
      const hiddenSliderWidth = totalIdeaPreviewWidth - this.getSliderContainerWidth();
      if (left === hiddenSliderWidth) {
        left -= this.getIdeaPrewiewWidth() - this.getLastMoveToRightValue() / 2;
        this.setState({ sliderLeftPosition: left, sliderCount: count });
      } else {
        left -= this.getIdeaPrewiewWidth();
        this.setState({ sliderLeftPosition: left, sliderCount: count });
      }
    } else {
      count = 0;
      this.setState({ sliderLeftPosition: 0, sliderCount: count });
    }
  }
  handleClickArrowRight() {
    const { ideas } = this.props;
    const { sliderCount, sliderLeftPosition } = this.state;
    let count = sliderCount;
    let left = sliderLeftPosition;
    const totalIdeaPreviewWidth = ideas.length * this.getIdeaPrewiewWidth();
    const hiddenSliderWidth = totalIdeaPreviewWidth - this.getSliderContainerWidth();
    const isLimitValueReached = this.getSliderLimitValue() >= hiddenSliderWidth;
    if (!isLimitValueReached) {
      count += 1;
      this.setState({ sliderCount: count });
      if (count === 1) {
        left += this.getIdeaPrewiewWidth() - this.getLastMoveToRightValue() / 2;
        this.setState({ sliderLeftPosition: left, sliderCount: count });
      } else {
        left += this.getIdeaPrewiewWidth();
        this.setState({ sliderLeftPosition: left, sliderCount: count });
      }
    } else {
      if (left < hiddenSliderWidth) {
        count += 1;
      }
      this.setState({ sliderLeftPosition: hiddenSliderWidth, sliderCount: count });
    }
  }
  render() {
    const { ideas, identifier, setSelectedIdeas, nbLevel, ideaLevel, selectedIdeasId } = this.props;
    const { sliderLeftPosition, sliderCount } = this.state;
    const slug = getDiscussionSlug();
    const ideaPreviewWidth = this.getIdeaPrewiewWidth();
    const totalIdeaPreviewWidth = ideas.length * ideaPreviewWidth;
    const sliderContainerWidth = this.getSliderContainerWidth();
    const hiddenSliderWidth = totalIdeaPreviewWidth - sliderContainerWidth;
    const isSliderLimitReached = sliderLeftPosition === hiddenSliderWidth;
    const isArrowVisible = totalIdeaPreviewWidth > this.getSliderContainerWidth();
    return (
      <div className="slider-container relative" style={nbLevel > 1 ? { width: `${sliderContainerWidth}px` } : {}}>
        <VisibilityComponent isVisible={isArrowVisible && nbLevel > 1 && sliderCount > 0} classname="slider-arrow-container">
          <div
            className="slider-arrow slider-arrow-left"
            onClick={() => {
              this.handleClickArrowLeft();
            }}
          >
            <span className="assembl-icon-down-open" />
          </div>
        </VisibilityComponent>
        <div className="slider" style={{ left: `-${sliderLeftPosition}px`, transition: 'all .2s ease-out' }}>
          <Row className={nbLevel > 1 ? 'no-margin row-inline' : 'no-margin'}>
            {ideas.map((idea, index) => {
              return (
                <Col
                  xs={12}
                  sm={6}
                  md={3}
                  key={index}
                  className={this.getColClassNames(index)}
                  style={nbLevel > 1 ? { width: ideaPreviewWidth } : {}}
                >
                  <IdeaPreview
                    imgUrl={idea.imgUrl}
                    numPosts={idea.numPosts}
                    numContributors={idea.numContributors}
                    numChildren={idea.numChildren}
                    link={`${getRoute('debate', { slug: slug, phase: identifier })}${getRoute('theme', { themeId: idea.id })}`}
                    title={idea.title}
                    description={idea.description}
                    setSelectedIdeas={setSelectedIdeas}
                    ideaId={idea.id}
                    ideaLevel={ideaLevel}
                    selectedIdeasId={selectedIdeasId}
                  />
                </Col>
              );
            })}
          </Row>
        </div>
        <VisibilityComponent isVisible={isArrowVisible && nbLevel > 1 && !isSliderLimitReached} classname="slider-arrow-container">
          <div
            className="slider-arrow slider-arrow-right"
            onClick={() => {
              this.handleClickArrowRight();
            }}
          >
            <span className="assembl-icon-up-open" />
          </div>
        </VisibilityComponent>
      </div>
    );
  }
}

export default IdeasLevel;