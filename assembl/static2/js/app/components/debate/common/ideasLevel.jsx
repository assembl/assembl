import React from 'react';
import { Row, Col } from 'react-bootstrap';
import IdeaPreview from '../../common/ideaPreview';
import { get as getRoute } from '../../../utils/routeMap';
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import { APP_CONTAINER_MAX_WIDTH, IDEA_PREVIEW_MAX_WIDTH, NB_IDEA_PREVIEW_TO_SHOW, APP_CONTAINER_PADDING } from '../../../constants';

class IdeasLevel extends React.Component {
  constructor(props) {
    super(props);
    this.getColClassNames = this.getColClassNames.bind(this);
    this.getColWidth = this.getColWidth.bind(this);
    this.getSliderWidth = this.getSliderWidth.bind(this);
  }
  getColClassNames(index) {
    const { currentLevel } = this.props;
    this.index = index;
    let styles = 'theme';
    if (currentLevel <= 1) {
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
  getColWidth() {
    const screenWidth = window.innerWidth;
    this.colWidth = IDEA_PREVIEW_MAX_WIDTH;
    if (screenWidth < APP_CONTAINER_MAX_WIDTH) {
      this.colWidth = screenWidth / NB_IDEA_PREVIEW_TO_SHOW;
    }
    return this.colWidth;
  }
  getSliderWidth() {
    const screenWidth = window.innerWidth;
    const halfColWidth = this.getColWidth() / 2;
    const availableRightSpace = screenWidth - APP_CONTAINER_MAX_WIDTH;
    let sliderWidth = APP_CONTAINER_MAX_WIDTH + halfColWidth;
    if (availableRightSpace < halfColWidth) {
      sliderWidth = availableRightSpace + APP_CONTAINER_MAX_WIDTH - APP_CONTAINER_PADDING;
    }
    return sliderWidth;
  }
  render() {
    const { ideas, identifier, setLevelsToDisplay, currentLevel, ideaLevel } = this.props;
    const slug = getDiscussionSlug();
    return (
      <div className="slider" style={currentLevel > 1 ? { width: `${this.getSliderWidth()}px` } : {}}>
        <Row className={currentLevel > 1 ? 'no-margin row-inline' : 'no-margin'}>
          {ideas.map((idea, index) => {
            return (
              <Col
                xs={12}
                sm={6}
                md={3}
                key={index}
                className={this.getColClassNames(index)}
                style={currentLevel > 1 ? { width: this.getColWidth() } : {}}
              >
                <IdeaPreview
                  imgUrl={idea.imgUrl}
                  numPosts={idea.numPosts}
                  numContributors={idea.numContributors}
                  numChildren={idea.numChildren}
                  isSelected={false}
                  link={`${getRoute('debate', { slug: slug, phase: identifier })}${getRoute('theme', { themeId: idea.id })}`}
                  title={idea.title}
                  description={idea.description}
                  setLevelsToDisplay={setLevelsToDisplay}
                  ideaId={idea.id}
                  ideaLevel={ideaLevel}
                />
              </Col>
            );
          })}
        </Row>
      </div>
    );
  }
}

export default IdeasLevel;