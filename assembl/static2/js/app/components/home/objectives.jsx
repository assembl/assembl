import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';

import { get } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { getCurrentPhaseIdentifier } from '../../utils/timeline';
import { browserHistory } from '../../router';
import ParticipateButton from '../common/participateButton';

class Objectives extends React.Component {
  constructor(props) {
    super(props);
    this.displayPhase = this.displayPhase.bind(this);
  }

  displayPhase() {
    const slug = { slug: getDiscussionSlug() };
    const { timeline } = this.props;
    const currentPhaseIdentifier = getCurrentPhaseIdentifier(timeline);
    browserHistory.push(get('debate', { ...slug, phase: currentPhaseIdentifier }));
  }

  render() {
    const { debateData } = this.props.debate;
    const { timeline } = this.props;
    let { locale } = this.props.i18n;
    if (locale === 'zh-CN') {
      locale = 'zh_CN';
    }
    return (
      <section className="home-section objectives-section">
        <Grid fluid>
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">{debateData.objectives.titleEntries[locale]}</h1>
            </div>
            <div className="content-section">
              <div className="content-margin">
                <Row>
                  <Col
                    xs={12}
                    sm={12}
                    md={debateData.objectives.images.img1Url && debateData.objectives.images.img2Url ? 6 : 9}
                    className="objectives"
                  >
                    <div
                      className={
                        debateData.objectives.images.img1Url && debateData.objectives.images.img2Url
                          ? 'text-column-2'
                          : 'text-column-3'
                      }
                    >
                      <span>{debateData.objectives.descriptionEntries[locale]}</span>
                    </div>
                  </Col>
                  {debateData.objectives.images && (
                    <div>
                      {debateData.objectives.images.img1Url && (
                        <Col xs={12} sm={6} md={3} className="objectives">
                          <div
                            className="objectives-img"
                            style={{ backgroundImage: `url(${debateData.objectives.images.img1Url})` }}
                          />
                        </Col>
                      )}
                      {debateData.objectives.images.img2Url && (
                        <Col xs={12} sm={6} md={3} className="objectives">
                          <div
                            className="objectives-img"
                            style={{ backgroundImage: `url(${debateData.objectives.images.img2Url})` }}
                          />
                        </Col>
                      )}
                    </div>
                  )}
                </Row>
              </div>
              <div className="center inline full-size margin-xxl">
                <ParticipateButton displayPhase={this.displayPhase} timeline={timeline} btnClass="dark" />
              </div>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

const mapStateToProps = state => ({
  debate: state.debate,
  i18n: state.i18n,
  timeline: state.timeline
});

export default connect(mapStateToProps)(Objectives);