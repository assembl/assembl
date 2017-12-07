import React from 'react';
import { Row, Col } from 'react-bootstrap';
import truncate from 'lodash/truncate';
import classNames from 'classnames';
import IdeaPreview from './ideaPreview';
import { get as getRoute } from '../../../utils/routeMap';
import { getDiscussionSlug, isMobile } from '../../../utils/globalFunctions';
import VisibilityComponent from '../../common/visibilityComponent';
import { withScreenWidth } from '../../common/screenDimensions';

import {
  APP_CONTAINER_MAX_WIDTH,
  NB_IDEA_PREVIEW_TO_SHOW,
  APP_CONTAINER_PADDING,
  IDEA_PREVIEW_MAX_WIDTH,
  IDEA_PREVIEW_MIN_WIDTH
} from '../../../constants';

const xsCol = 12;
const smCol = 6;
const mdCol = 3;

class IdeasLevel extends React.Component {
  constructor(props) {
    super(props);
    this.timeouts = [];
    this.state = {
      sliderCount: 0,
      sliderLeftPosition: 0,
      sliderContainerWidth: 0,
      ideaPreviewWidth: 0,
      sliderMarginTop: -500
    };
  }

  componentWillMount() {
    this.setDimensions();
    this.runBottomTransition(0, 1000);
  }

  componentDidMount() {
    this.runFirstTransition();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.screenWidth !== this.props.screenWidth) this.updateDimensions();
    const { ideaLevel, nbLevel, selectedIdeaIndex } = nextProps;
    const shouldSliderBeInitialize = ideaLevel < nbLevel;
    const isSliderInitialized = this.props.nbLevel <= 1;
    if (!shouldSliderBeInitialize) {
      this.setState({ sliderCount: 0, sliderLeftPosition: 0, sliderMarginTop: -500 });
      this.runBottomTransition(0, 700);
    } else if (isSliderInitialized) {
      this.setTimeout(() => {
        this.moveToSelectedIdea(selectedIdeaIndex);
      }, 500);
    }
  }

  componentWillUnmount() {
    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];
  }

  setTimeout = (func, duration) => {
    this.timeouts.push(setTimeout(func, duration));
  };

  setDimensions = () => {
    const { screenWidth } = this.props;
    if (screenWidth > APP_CONTAINER_MAX_WIDTH) {
      this.setState({
        sliderContainerWidth: APP_CONTAINER_MAX_WIDTH + this.getRightOverflowValue(),
        ideaPreviewWidth: APP_CONTAINER_MAX_WIDTH / NB_IDEA_PREVIEW_TO_SHOW
      });
    } else {
      const ideaPreviewWidth = (screenWidth - APP_CONTAINER_PADDING) / (NB_IDEA_PREVIEW_TO_SHOW + 0.5);
      if (ideaPreviewWidth <= IDEA_PREVIEW_MIN_WIDTH) {
        this.setState({
          sliderContainerWidth: screenWidth - APP_CONTAINER_PADDING * 2,
          ideaPreviewWidth: IDEA_PREVIEW_MIN_WIDTH
        });
      } else {
        this.setState({
          sliderContainerWidth: screenWidth - APP_CONTAINER_PADDING * 2,
          ideaPreviewWidth: ideaPreviewWidth
        });
      }
    }
  };

  updateDimensions = () => {
    this.setState(
      {
        sliderCount: 0,
        sliderLeftPosition: 0
      },
      this.setDimensions
    );
  };

  getColClassNames(index) {
    const { ideaLevel } = this.props;
    const isFirsStepActif = ideaLevel <= 1;
    this.index = index;
    return classNames(
      'theme',
      { clear: this.index % 4 === 0 && isFirsStepActif },
      { [` theme-first-row-${this.index % 4}`]: this.index <= 3 && isFirsStepActif },
      { [` theme-${this.index % 4}`]: this.index > 3 && isFirsStepActif },
      { 'theme-inline': !isFirsStepActif }
    );
  }

  getRightOverflowValue() {
    const { screenWidth } = this.props;
    const { sliderContainerWidth, ideaPreviewWidth } = this.state;
    let rightOverflowValue = 0;
    // If the screen width is bigger than the app container
    const isLargeScreen = screenWidth > APP_CONTAINER_MAX_WIDTH;
    // if the screen width is not large enough to display the NB_IDEA_PREVIEW_TO_SHOW
    const isSmallScreen = screenWidth - APP_CONTAINER_PADDING * 2 <= ideaPreviewWidth * NB_IDEA_PREVIEW_TO_SHOW;
    if (isLargeScreen) {
      rightOverflowValue = (screenWidth - APP_CONTAINER_MAX_WIDTH) / 2;
      if (rightOverflowValue > IDEA_PREVIEW_MAX_WIDTH / 2) {
        rightOverflowValue = IDEA_PREVIEW_MAX_WIDTH / 2;
      }
    } else if (isSmallScreen) {
      const DisplayedThumbsCount = (screenWidth - APP_CONTAINER_PADDING * 2) / IDEA_PREVIEW_MIN_WIDTH;
      const ratio = DisplayedThumbsCount - Math.trunc(DisplayedThumbsCount);
      rightOverflowValue = IDEA_PREVIEW_MIN_WIDTH * ratio;
    } else {
      rightOverflowValue = sliderContainerWidth - ideaPreviewWidth * NB_IDEA_PREVIEW_TO_SHOW;
    }
    return rightOverflowValue;
  }

  getSliderWidth() {
    const { ideas } = this.props;
    const { ideaPreviewWidth } = this.state;
    return ideas.length * ideaPreviewWidth;
  }

  getSliderHiddenWidth() {
    const { sliderContainerWidth } = this.state;
    return this.getSliderWidth() - sliderContainerWidth;
  }

  getLastMovingValue() {
    const { ideas } = this.props;
    const { ideaPreviewWidth } = this.state;
    if (ideas.length <= NB_IDEA_PREVIEW_TO_SHOW + 1) {
      return ideaPreviewWidth - this.getRightOverflowValue();
    }
    return ideaPreviewWidth - this.getRightOverflowValue() / 2;
  }

  moveToSelectedIdea(selectedIdeaIndex) {
    const { ideas } = this.props;
    const { sliderLeftPosition, ideaPreviewWidth } = this.state;
    let count = selectedIdeaIndex;
    let left = sliderLeftPosition;
    if (selectedIdeaIndex >= NB_IDEA_PREVIEW_TO_SHOW) {
      for (let i = 0; i < count; i += 1) {
        if (i === 0 || i === ideas.length - NB_IDEA_PREVIEW_TO_SHOW - 1) {
          left += this.getLastMovingValue();
        } else if (i < ideas.length - NB_IDEA_PREVIEW_TO_SHOW - 1) {
          left += ideaPreviewWidth;
        }
      }
      if (selectedIdeaIndex > ideas.length - NB_IDEA_PREVIEW_TO_SHOW) {
        count = ideas.length - NB_IDEA_PREVIEW_TO_SHOW;
      }
      this.setState({ sliderCount: count });
      this.setState({ sliderLeftPosition: left });
    }
  }

  runFirstTransition() {
    const { nbLevel } = this.props;
    const themes = document.getElementById('row-1').getElementsByClassName('theme');
    if (nbLevel > 1) {
      this.setTimeout(() => {
        for (let i = 0; i < themes.length; i += 1) {
          themes[i].className = `theme theme-inline col-md-${mdCol} col-sm-${smCol} col-xs-${xsCol}`;
        }
      }, 10);
    }
  }

  runBottomTransition(sliderMarginTop, duration) {
    this.setTimeout(() => {
      this.setState({ sliderMarginTop: sliderMarginTop });
    }, duration);
  }

  isLeftLimitReached() {
    const { sliderLeftPosition } = this.state;
    return sliderLeftPosition === this.getLastMovingValue();
  }

  isRightLimitReached() {
    const { sliderLeftPosition } = this.state;
    return sliderLeftPosition >= this.getSliderHiddenWidth();
  }

  handleClickArrowLeft() {
    const { ideas } = this.props;
    const { sliderCount, sliderLeftPosition, ideaPreviewWidth } = this.state;
    let count = sliderCount;
    let left = sliderLeftPosition;
    if (count > 0) {
      count -= 1;
    }
    if (count === 0) {
      left = 0;
    } else if (count === ideas.length - NB_IDEA_PREVIEW_TO_SHOW - 1) {
      left -= this.getLastMovingValue();
    } else {
      left -= ideaPreviewWidth;
    }
    this.setState({ sliderCount: count });
    this.setState({ sliderLeftPosition: left });
  }

  handleClickArrowRight() {
    const { ideas } = this.props;
    const { sliderCount, sliderLeftPosition, ideaPreviewWidth } = this.state;
    let count = sliderCount;
    let left = sliderLeftPosition;
    if (!this.isRightLimitReached()) {
      count += 1;
    }
    if (count === 1 || count === ideas.length - NB_IDEA_PREVIEW_TO_SHOW) {
      left += this.getLastMovingValue();
    } else {
      left += ideaPreviewWidth;
    }
    this.setState({ sliderCount: count });
    this.setState({ sliderLeftPosition: left });
  }

  render() {
    const { ideas, identifier, setSelectedIdeas, nbLevel, ideaLevel, selectedIdeasId } = this.props;
    const { sliderLeftPosition, sliderCount, sliderContainerWidth, ideaPreviewWidth, sliderMarginTop } = this.state;
    const slug = getDiscussionSlug();
    const isRightLimitReached = this.isRightLimitReached();
    const isArrowVisible = this.getSliderWidth() > sliderContainerWidth;
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
    const isTouchScreenDevice = isMobile.any();
    return (
      <div
        className={isTouchScreenDevice ? 'mobile-tdi slider-container relative' : 'slider-container relative'}
        style={nbLevel > 1 ? { width: `${sliderContainerWidth}px` } : {}}
      >
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
        <div
          className="slider"
          style={
            ideaLevel > 1
              ? { left: `-${sliderLeftPosition}px`, marginTop: `${sliderMarginTop}px`, transition: 'all .5s ease-out' }
              : { left: `-${sliderLeftPosition}px`, transition: 'all .2s ease-out' }
          }
        >
          <Row id={`row-${ideaLevel}`} className={nbLevel > 1 ? 'no-margin row-inline' : 'no-margin'}>
            {ideas.map((idea, index) => (
              <Col
                xs={xsCol}
                sm={smCol}
                md={mdCol}
                key={index}
                className={this.getColClassNames(index)}
                style={nbLevel > 1 ? { width: ideaPreviewWidth } : {}}
              >
                <IdeaPreview
                  imgUrl={idea.img ? idea.img.externalUrl : ''}
                  numPosts={idea.numPosts}
                  numContributors={idea.numContributors}
                  numChildren={idea.numChildren}
                  link={`${getRoute('debate', { slug: slug, phase: identifier })}${getRoute('theme', { themeId: idea.id })}`}
                  title={truncate(idea.title, {
                    length: stringMaxLength(ideaLevel),
                    separator: ' ',
                    omission: '...'
                  })}
                  description={idea.description}
                  setSelectedIdeas={setSelectedIdeas}
                  ideaId={idea.id}
                  ideaLevel={ideaLevel}
                  selectedIdeasId={selectedIdeasId}
                  ideaIndex={index}
                />
              </Col>
            ))}
          </Row>
        </div>
        <VisibilityComponent isVisible={isArrowVisible && nbLevel > 1 && !isRightLimitReached} classname="slider-arrow-container">
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

export default withScreenWidth(IdeasLevel);