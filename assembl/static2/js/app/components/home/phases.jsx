import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';
import { isCurrentPhase } from '../../utils/timeline';
import Phase from './phases/phase';
import Timeline from './phases/timeline';

class Phases extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    return (
      <section className="home-section phases-section">
        <Grid fluid>
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                <Translate value="home.timelineTitle" count={debateData.timeline.length} />
              </h1>
            </div>
            <div className="content-section">
              <Row className="no-margin">
                {debateData.timeline.map((phase, index) => {
                  return (
                    <Col
                      xs={12}
                      sm={24 / debateData.timeline.length}
                      md={12 / debateData.timeline.length}
                      className={isCurrentPhase(debateData.timeline[index]) ? 'no-padding phase' : 'no-padding phase hidden-xs'}
                      key={index}
                    >
                      <Phase
                        imgUrl={phase.image_url}
                        startDate={phase.start}
                        index={index}
                        title={phase.title}
                        description={phase.description}
                        identifier={phase.identifier}
                      />
                    </Col>
                  );
                })}
              </Row>
              <Row className="no-margin">
                {debateData.timeline.map((phase, index) => {
                  return (
                    <Col
                      xs={12 / debateData.timeline.length}
                      sm={12 / debateData.timeline.length}
                      md={12 / debateData.timeline.length}
                      className={'no-padding bar'}
                      key={index}
                    >
                      <Timeline index={index} />
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
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(Phases);