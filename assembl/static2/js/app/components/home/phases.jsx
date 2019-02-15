// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';
import { isCurrentPhase } from '../../utils/timeline';
import Phase from './phases/phase';
import Timeline from './phases/timeline';

type Props = {
  timeline: Timeline
};

const Phases = ({ timeline }: Props) => (
  <section className="home-section phases-section">
    <Grid fluid>
      <div className="max-container">
        <div className="title-section">
          <div className="title-hyphen">&nbsp;</div>
          <h1 className="dark-title-1">
            <Translate value="home.timelineTitle" count={timeline.length} />
          </h1>
        </div>
        <div className="content-section">
          <Row className="no-margin">
            {timeline.map((phase, index) => (
              <Col
                xs={12}
                sm={24 / timeline.length}
                md={12 / timeline.length}
                className={isCurrentPhase(timeline[index]) ? 'no-padding phase' : 'no-padding phase hidden-xs'}
                key={index}
              >
                <Phase
                  imgUrl={phase.image ? phase.image.externalUrl : null}
                  startDate={phase.start}
                  endDate={phase.end}
                  index={index}
                  title={phase.title}
                  description={phase.description}
                  identifier={phase.identifier}
                  phaseId={phase.id}
                />
              </Col>
            ))}
          </Row>
          <Row className="no-margin">
            {timeline.map((phase, index) => (
              <Col
                xs={12 / timeline.length}
                sm={12 / timeline.length}
                md={12 / timeline.length}
                className={'no-padding bar'}
                key={index}
              >
                <Timeline index={index} />
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </Grid>
  </section>
);

const mapStateToProps = state => ({
  timeline: state.timeline
});

export default connect(mapStateToProps)(Phases);