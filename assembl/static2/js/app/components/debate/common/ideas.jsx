import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';
import IdeaPreview from '../../common/ideaPreview';
import { get } from '../../../utils/routeMap';
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import '../../../../../css/components/ideas.scss';

class Ideas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAnimatingTowardsInline: false,
      selectedIdea: null
    };
    this.onSeeSubIdeasClick = this.onSeeSubIdeasClick.bind(this);
  }
  onSeeSubIdeasClick(ideaId) {
    this.setState({ isAnimatingTowardsInline: true });
    this.setState({ selectedIdea: ideaId });
  }
  render() {
    const { thematics, identifier } = this.props;
    const { selectedIdea } = this.state;
    const slug = getDiscussionSlug();
    return (
      <section
        className={
          this.state.isAnimatingTowardsInline ? 'themes-section ideas-section animating-towards-inline' : 'themes-section ideas-section'
        }
      >
        <Grid fluid className="background-grey">
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                <Translate value="debate.survey.themesTitle" />
              </h1>
            </div>
            <div className="content-section">
              <Row className="no-margin">
                {thematics.map((thematic, index) => {
                  return (
                    <Col xs={12} sm={6} md={3} className={index % 4 === 0 ? 'theme no-padding clear' : 'theme no-padding'} key={index}>
                      <IdeaPreview
                        imgUrl={thematic.imgUrl}
                        numPosts={thematic.numPosts}
                        numContributors={thematic.numContributors}
                        numChildren={thematic.numChildren}
                        link={`${get('debate', { slug: slug, phase: identifier })}${get('theme', { themeId: thematic.id })}`}
                        title={thematic.title}
                        description={thematic.description}
                        onSeeSubIdeasClick={() => {
                          this.onSeeSubIdeasClick(thematic.id);
                        }}
                      />
                    </Col>
                  );
                })}
              </Row>
            </div>
          </div>
        </Grid>
        {selectedIdea &&
          <div>
            {selectedIdea}
          </div>}
      </section>
    );
  }
}

export default Ideas;