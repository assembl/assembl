import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';
import { isPhaseStarted, getStartDatePhase } from '../../../utils/timeline';
import NotStartedPhase from './notStartedPhase';
import ThematicPreview from '../../common/thematicPreview';

class Themes extends React.Component {
  render() {
    const { thematics, identifier } = this.props;
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    const phaseStarted = isPhaseStarted(debateData.timeline, identifier);
    const startDatePhase = getStartDatePhase(debateData.timeline, identifier);
    if (phaseStarted) {
      return (
        <section className="themes-section">
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
                      <Col xs={12} sm={6} md={3} className={index % 4 === 0 ? 'theme no-padding clear' : 'theme no-padding'} key={`thematic-${index}`}>
                        <ThematicPreview
                          imgUrl={thematic.imgUrl}
                          numPosts={thematic.numPosts}
                          numContributors={thematic.numContributors}
                          link={`${rootPath}${debateData.slug}/debate/${identifier}/theme/${thematic.id.split(':')[1]}`}
                          title={thematic.title}
                          description={thematic.description}
                        />
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </div>
          </Grid>
        </section>
      );
    }
    return (
      <NotStartedPhase startDate={startDatePhase} />
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    context: state.context
  };
};

export default connect(mapStateToProps)(Themes);