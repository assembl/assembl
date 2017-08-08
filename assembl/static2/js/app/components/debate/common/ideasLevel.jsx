import React from 'react';
import { Row, Col } from 'react-bootstrap';
import IdeaPreview from '../../common/ideaPreview';
import VisibilityComponent from '../../common/visibilityComponent';
import { get } from '../../../utils/routeMap';
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import '../../../../../css/components/ideas.scss';

class IdeasLevel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAnimatingTowardsInline: false,
      isInline: props.isInline || false,
      selectedIdea: props.selectedIdea || null,
      isScrollLeftButtonVisible: props.isInline || false,
      isScrollRightButtonVisible: props.isInline || false
    };

    this.onOwnSeeSubIdeasClick = this.onOwnSeeSubIdeasClick.bind(this);
    this.updateScrollButtonsVisibility = this.updateScrollButtonsVisibility.bind(this);
    this.myMoveAllChildren = this.myMoveAllChildren.bind(this);
    this.myOnScrollRightClick = this.myOnScrollRightClick.bind(this);
    this.myOnScrollLeftClick = this.myOnScrollLeftClick.bind(this);
  }
  onOwnSeeSubIdeasClick(ideaId) {
    this.setState({ isAnimatingTowardsInline: true });
    this.setState({ selectedIdea: ideaId });
    this.initializeConstants();
    this.updateScrollButtonsVisibility(this.state.isInline, true);
  }
  getOption(name) {
    return this.options[name];
  }
  setOption(name, value) {
    this.options[name] = value;
  }
  updateScrollButtonsVisibility(isInline, isAnimatingTowardsInline) {
    if (!(isInline || isAnimatingTowardsInline)) {
      this.scrollLeft.setState({ isVisible: false });
      this.scrollRight.setState({ isVisible: false });
    } else {
      const targetValueInt = this.getOption('scrollDisplacement');
      const displacementMin = this.getOption('displacementMin');
      const displacementMax = this.getOption('displacementMax');
      if (targetValueInt >= displacementMax) {
        this.scrollLeft.setState({ isVisible: false });
      } else {
        this.scrollLeft.setState({ isVisible: true });
      }

      if (targetValueInt <= displacementMin) {
        this.scrollRight.setState({ isVisible: false });
      } else {
        this.scrollRight.setState({ isVisible: true });
      }
    }
  }
  initializeConstants() {
    const scrollDisplacement = 0;
    const thematicWidth = 350; /* TODO: read dynamically from DOM */
    const carouselWidth = 1400; /* TODO: read dynamically from DOM */
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
    const displacementMin = -1.0 * (len * thematicWidth - carouselWidth);
    const displacementMax = 0;

    this.options = {
      scrollDisplacement: scrollDisplacement,
      thematicWidth: thematicWidth,
      animationDistance: thematicWidth,
      carouselWidth: carouselWidth,
      displacementMin: displacementMin,
      displacementMax: displacementMax
    };
  }
  myMoveAllChildren(element, distance) {
    let targetValue = 0;
    let currentValue = 0;
    const displacementMin = this.getOption('displacementMin');
    const displacementMax = this.getOption('displacementMax');
    if (element.childNodes && element.childNodes.length) {
      const el0 = element.childNodes[0];
      currentValue = el0.style.left;
      let targetValueInt = 0;
      if (!currentValue) {
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

      this.updateScrollButtonsVisibility(this.state.isInline, this.state.isAnimatingTowardsInline);
    }
  }
  myOnScrollRightClick(ev) {
    const row = ev.target.parentElement.parentElement.children[1];
    this.myMoveAllChildren(row, -1 * this.getOption('animationDistance'));
  }
  myOnScrollLeftClick(ev) {
    const row = ev.target.parentElement.parentElement.children[1];
    this.myMoveAllChildren(row, this.getOption('animationDistance'));
  }
  render() {
    const { thematics, identifier, onSeeSubIdeasClick, level } = this.props;
    const { isScrollLeftButtonVisible, isScrollRightButtonVisible } = this.state;
    const { selectedIdea } = this.state;
    const slug = getDiscussionSlug();
    let classNames = [];
    if (this.state.isAnimatingTowardsInline) {
      classNames.push('animating-towards-inline');
    }
    if (this.state.isInline) {
      classNames.push('is-inline');
    } else {
      classNames.push('multiline');
    }
    classNames = classNames.join(' ');

    return (
      <div className={classNames}>
        <VisibilityComponent
          isVisible={isScrollLeftButtonVisible}
          ref={(el) => {
            this.scrollLeft = el;
          }}
        >
          <div className="scroll-left" onClick={this.myOnScrollLeftClick} />
        </VisibilityComponent>
        <Row
          className="no-margin"
          ref={(el) => {
            this.row = el;
          }}
        >
          {thematics.map((thematic, index) => {
            return (
              <Col xs={12} sm={6} md={3} className={index % 4 === 0 ? 'theme no-padding clear' : 'theme no-padding'} key={index}>
                <IdeaPreview
                  imgUrl={thematic.imgUrl}
                  numPosts={thematic.numPosts}
                  numContributors={thematic.numContributors}
                  numChildren={thematic.numChildren}
                  isSelected={selectedIdea === thematic.id}
                  link={`${get('debate', { slug: slug, phase: identifier })}${get('theme', { themeId: thematic.id })}`}
                  title={thematic.title}
                  description={thematic.description}
                  onSeeSubIdeasClick={() => {
                    onSeeSubIdeasClick(thematic.id, level);
                    this.onOwnSeeSubIdeasClick(thematic.id);
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
        >
          <div className="scroll-right" onClick={this.myOnScrollRightClick} />
        </VisibilityComponent>
      </div>
    );
  }
}

export default IdeasLevel;