import React from 'react';
import { Row, Col } from 'react-bootstrap';
import getValue from 'lodash/get';
import IdeaPreview from '../../common/ideaPreview';
import VisibilityComponent from '../../common/visibilityComponent';
import { get as getRoute } from '../../../utils/routeMap';
import { getDiscussionSlug } from '../../../utils/globalFunctions';

class IdeasLevel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isInline: props.isInline || false,
      selectedIdea: props.selectedIdea || null,
      isScrollLeftButtonVisible: props.isInline || false,
      isScrollRightButtonVisible: props.isInline || false
    };
    this.options = {};
    this.setOption('selectedIdea', props.selectedIdea || null);

    this.initializeConstants();

    this.onSeeSubIdeasClick = this.onSeeSubIdeasClick.bind(this);
    this.updateScrollButtonsVisibility = this.updateScrollButtonsVisibility.bind(this);
    this.moveAllChildren = this.moveAllChildren.bind(this);
    this.onScrollRightClick = this.onScrollRightClick.bind(this);
    this.onScrollLeftClick = this.onScrollLeftClick.bind(this);
    this.scrollToIdeaIndexIfNecessary = this.scrollToIdeaIndexIfNecessary.bind(this);
    this.refMe = this.refMe.bind(this);
    this.refRow = this.refRow.bind(this);
    this.updateWidth = this.updateWidth.bind(this);
    this.getClassNames = this.getClassNames.bind(this);
  }

  componentDidMount() {
    this.initializeConstants();
  }

  onSeeSubIdeasClick(ideaId, index, step = 0) {
    const wasInline = this.state.isInline || this.getOption('isAnimatingTowardsInline');

    if (!wasInline) {
      const goNextStep = () => {
        this.onSeeSubIdeasClick(ideaId, index, step + 1);
      };
      goNextStep.bind(this);

      if (!step) {
        /*
        Animation step 0:
          - Animate ideas top margins from various values to 0
          - Set row width to its current width, in anticipation of future animation
          - Set ideas left position to their current left position (0), in anticipation of future scroll animation
          - Set ideas width to current width, in anticipation of future resize animation
        */
        const row = this.getRow();
        row.style.width = `${row.clientWidth}px`;
        row.style.transition = 'width 0.5s';
        row.childNodes.forEach((el) => {
          const el2 = el;
          el2.style.width = `${el2.clientWidth}px`;
          el2.style.marginTop = '0';
          el2.style.left = '0';
          el2.style.flexShrink = '0';
        });

        setTimeout(goNextStep, 500);
        return;
      } else if (step === 1) {
        /*
        Animation step 1:
          - Set ideas positioning to a single row (set row display to inline-flex)
          - Set necessary values consequently to inline-flex, for animation consistency
        */
        this.initializeConstants();

        const row = this.getRow();

        row.style.overflowX = 'hidden';
        row.style.display = 'inline-flex';

        setTimeout(goNextStep, 50);
        return;
      } else if (step === 2) {
        /*
        Animation step 2:
          - Animate row width from full page width to custom value
          - Animate ideas width from initial width to carousel-adapted width
        */

        this.setOption('isAnimatingTowardsInline', true);
        this.updateWidth();

        const row = this.getRow();
        const thematicWidthPx = `${this.getOption('thematicWidth')}px`;
        row.childNodes.forEach((el) => {
          const el2 = el;
          el2.style.width = thematicWidthPx;
        });

        this.scrollToIdeaIndexIfNecessary(index);

        const f = () => {
          this.onSeeSubIdeasClick(ideaId, index, step + 1);
          this.forceUpdate();
        };
        f.bind(this);

        setTimeout(f, 500);

        return;
      }
    }

    this.setOption('isAnimatingTowardsInline', true);
    this.me.classList.add('animating-towards-inline');

    this.setOption('selectedIdea', ideaId);

    this.initializeConstants();

    // make sure that the clicked thematic shows fully when inline (scroll at the correct position so that it is shown)
    if (!wasInline) {
      this.scrollToIdeaIndexIfNecessary(index);
    }
    this.updateScrollButtonsVisibility(this.state.isInline, true);
  }

  onScrollRightClick() {
    this.initializeConstants();
    this.moveAllChildren(this.getRow(), -1 * this.getOption('animationDistance'));
  }

  onScrollLeftClick() {
    this.initializeConstants();
    this.moveAllChildren(this.getRow(), this.getOption('animationDistance'));
  }

  getRow() {
    if (this.me) {
      return this.me.childNodes[1];
    }
    return null;
  }

  getOption(name) {
    return getValue(this, ['options', name], null);
  }

  setOption(name, value) {
    this.options[name] = value;
  }

  getClassNames(index) {
    this.index = index;
    let styles = 'theme no-padding';
    if (this.index % 4 === 0) {
      styles += ' clear';
    }
    if (this.index <= 3) {
      styles += ` theme-first-row-${this.index % 4}`;
    } else {
      styles += ` theme-${this.index % 4}`;
    }
    return styles;
  }

  updateWidth() {
    if (this.me) {
      if (this.state.isInline || this.getOption('isAnimatingTowardsInline')) {
        this.me.style.width = `${this.getOption('carouselWidth')}px`;
        const row = this.getRow();
        if (row) {
          row.style.width = `${this.getOption('carouselWidth')}px`;
        }
      }
    }
  }

  scrollToIdeaIndexIfNecessary(index) {
    const thematicWidth = this.getOption('thematicWidth');
    const carouselWidth = this.getOption('carouselWidth');
    const ideaInitialX = index * thematicWidth;
    if (ideaInitialX + thematicWidth > carouselWidth) {
      const numberOfIdeasFullyShown = Math.floor(carouselWidth / thematicWidth);
      const middleIdeaX = Math.floor(numberOfIdeasFullyShown / 2) * thematicWidth;
      const targetScrollValue = -1 * (index * thematicWidth - middleIdeaX);
      this.moveAllChildren(this.getRow(), targetScrollValue, true);
    }
  }

  updateScrollButtonsVisibility(isInline, isAnimatingTowardsInline) {
    const thematicWidth = this.getOption('thematicWidth');
    const parentWidth = this.getOption('parentWidth');
    const numberOfThematics = this.getOption('numberOfThematics');
    let targetScrollLeftVisibility = false;
    let targetScrollRightVisibility = false;

    if (!(isInline || isAnimatingTowardsInline)) {
      // if ideas do not display inline, then do not show any scroll icon
      targetScrollLeftVisibility = false;
      targetScrollRightVisibility = false;
    } else if (numberOfThematics * thematicWidth < parentWidth) {
      // if ideas show inline and all ideas can show in the carousel with no need to scroll, then do not show any scroll icon
      targetScrollLeftVisibility = false;
      targetScrollRightVisibility = false;
    } else {
      const targetValueInt = this.getOption('scrollDisplacement');
      const displacementMin = this.getOption('displacementMin');
      const displacementMax = this.getOption('displacementMax');
      if (targetValueInt >= displacementMax) {
        targetScrollLeftVisibility = false;
      } else {
        targetScrollLeftVisibility = true;
      }

      if (targetValueInt <= displacementMin) {
        targetScrollRightVisibility = false;
      } else {
        targetScrollRightVisibility = true;
      }
    }

    /*
    FIXME: Using this.setState() with isScrollLeftButtonVisible and
    isScrollRightButtonVisible does not show correct buttons UI, why?
    Below is a workaround.
    */
    if (!this.scrollLeft || !this.scrollRight) {
      const f = () => {
        this.updateScrollButtonsVisibility(isInline, isAnimatingTowardsInline);
      };
      f.bind(this);
      setTimeout(f, 500);
    } else {
      this.scrollLeft.setState({ isVisible: targetScrollLeftVisibility });
      this.scrollLeft.forceUpdate(); // FIXME: Why is this needed? component should re-render and show correct UI by itself
      this.scrollRight.setState({ isVisible: targetScrollRightVisibility });
      this.scrollRight.forceUpdate(); // FIXME: Why is this needed? component should re-render and show correct UI by itself
    }
  }

  initializeConstants() {
    let parentWidth = 1400;
    if (this.me && this.me.parentNode && this.me.parentNode.clientWidth) {
      parentWidth = this.me.parentNode.clientWidth;
    }

    const scrollDisplacement = this.getOption('scrollDisplacement') || 0;

    let thematicWidth = 350;
    let thematicWidthPercent = 100;
    let numberOfThematicsToShow = 4.5;
    if (parentWidth < 850) {
      numberOfThematicsToShow = 2.5;
    } else if (parentWidth < 1000) {
      numberOfThematicsToShow = 3.5;
    }
    thematicWidth = parentWidth / numberOfThematicsToShow;
    thematicWidthPercent = thematicWidth / parentWidth;

    let carouselTargetWidth = (Math.floor(parentWidth / thematicWidth) - 0.5) * thematicWidth;
    if (carouselTargetWidth < 1.5 * thematicWidth) {
      carouselTargetWidth = 1.5 * thematicWidth;
    }

    let len = 0;
    if (
      this.props &&
      'thematics' in this.props &&
      this.props.thematics &&
      'length' in this.props.thematics &&
      this.props.thematics.length
    ) {
      len = this.props.thematics.length;
    }
    if (len === 0 || !this.me || !this.getRow()) {
      const f = () => {
        this.initializeConstants();
        this.updateWidth();
      };
      f.bind(this);
      setTimeout(f, 50);
    }
    const displacementMin = -1.0 * (len * thematicWidth - carouselTargetWidth);
    const displacementMax = 0;

    this.setOption('numberOfThematics', len);
    this.setOption('scrollDisplacement', scrollDisplacement);
    this.setOption('thematicWidth', thematicWidth);
    this.setOption('thematicWidthPercent', thematicWidthPercent);
    this.setOption('animationDistance', thematicWidth);
    this.setOption('parentWidth', parentWidth);
    this.setOption('carouselWidth', carouselTargetWidth);
    this.setOption('displacementMin', displacementMin);
    this.setOption('displacementMax', displacementMax);
  }

  moveAllChildren(element, distance, absolute) {
    let targetValue = 0;
    let currentValue = 0;
    const displacementMin = this.getOption('displacementMin');
    const displacementMax = this.getOption('displacementMax');
    if (element.childNodes && element.childNodes.length) {
      const el0 = element.childNodes[0];
      currentValue = el0.style.left || 0;
      let targetValueInt = 0;
      if (!currentValue || absolute) {
        targetValueInt = distance;
      } else {
        targetValueInt = parseInt(currentValue, 10) + distance;
      }

      if (targetValueInt >= displacementMax) {
        targetValueInt = displacementMax;
      }

      if (targetValueInt <= displacementMin) {
        targetValueInt = displacementMin;
      }

      targetValue = `${targetValueInt}px`;
      this.setOption('scrollDisplacement', targetValueInt);

      element.childNodes.forEach((el) => {
        const el2 = el;
        if (!currentValue) {
          el2.style.left = 0; // first set to 0 for smooth CSS animation
          el2.style.left = targetValue;
        } else {
          el2.style.left = targetValue;
        }
      });

      this.updateScrollButtonsVisibility(this.state.isInline, this.getOption('isAnimatingTowardsInline'));
    }
  }
  refMe(el) {
    this.me = el;
  }
  refRow(el) {
    this.row = el;
    this.initializeConstants();
    this.updateWidth();
    this.updateScrollButtonsVisibility(this.state.isInline, this.getOption('isAnimatingTowardsInline'));
  }

  render() {
    const { thematics, identifier, onSeeSubIdeasClick, level } = this.props;
    const { isScrollLeftButtonVisible, isScrollRightButtonVisible, isInline } = this.state;
    const selectedIdea = this.getOption('selectedIdea');
    const slug = getDiscussionSlug();
    let classNames = ['ideas-level'];
    if (this.getOption('isAnimatingTowardsInline')) {
      classNames.push('animating-towards-inline');
    }
    if (this.state.isInline) {
      classNames.push('is-inline');
    } else {
      classNames.push('multiline');
    }
    classNames = classNames.join(' ');

    const thematicStyle = {};
    if (isInline) {
      thematicStyle.width = `${this.getOption('thematicWidth')}px`;
    }

    return (
      <div className={classNames} ref={this.refMe}>
        <VisibilityComponent
          isVisible={isScrollLeftButtonVisible}
          ref={(el) => {
            this.scrollLeft = el;
          }}
          className="scroll-left-container"
        >
          <div className="scroll-left" onClick={this.onScrollLeftClick} />
        </VisibilityComponent>
        <Row className="no-margin" ref={this.refRow}>
          {thematics.map((thematic, index) => {
            return (
              <Col xs={12} sm={6} md={3} className={this.getClassNames(index)} key={index} style={thematicStyle}>
                <IdeaPreview
                  imgUrl={thematic.imgUrl}
                  numPosts={thematic.numPosts}
                  numContributors={thematic.numContributors}
                  numChildren={thematic.numChildren}
                  isSelected={selectedIdea === thematic.id}
                  link={`${getRoute('debate', { slug: slug, phase: identifier })}${getRoute('theme', { themeId: thematic.id })}`}
                  title={thematic.title}
                  description={thematic.description}
                  onSeeSubIdeasClick={() => {
                    onSeeSubIdeasClick(thematic.id, level);
                    this.onSeeSubIdeasClick(thematic.id, index);
                  }}
                />
              </Col>
            );
          })}
        </Row>
        <VisibilityComponent
          isVisible={isScrollRightButtonVisible}
          ref={(el) => {
            this.scrollRight = el;
          }}
          className="scroll-right-container"
        >
          <div className="scroll-right" onClick={this.onScrollRightClick} />
        </VisibilityComponent>
      </div>
    );
  }
}

export default IdeasLevel;