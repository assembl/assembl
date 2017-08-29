import React from 'react';
import { Row, Col } from 'react-bootstrap';
import IdeaPreview from '../../common/ideaPreview';
import { get as getRoute } from '../../../utils/routeMap';
import { getDiscussionSlug } from '../../../utils/globalFunctions';

class IdeasLevel extends React.Component {
  constructor(props) {
    super(props);
    this.getColClassNames = this.getColClassNames.bind(this);
  }
  getColClassNames(index) {
    const { level } = this.props;
    this.index = index;
    let styles = 'theme';
    if (level <= 1) {
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
  render() {
    const { ideas, identifier, setLevelsToDisplay, level } = this.props;
    const slug = getDiscussionSlug();
    return (
      <div className="slider">
        <Row className={level > 1 ? 'no-margin row-inline' : 'no-margin'}>
          {ideas.map((idea, index) => {
            return (
              <Col xs={12} sm={6} md={3} key={index} className={this.getColClassNames(index)}>
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