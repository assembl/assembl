import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { browserHistory } from 'react-router';
import { Grid, Row, Col, Button } from 'react-bootstrap';
import { get } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { displayModal } from '../../utils/utilityManager';
import { getCurrentPhaseIdentifier, getPhaseName, isSeveralIdentifiers } from '../../utils/timeline';

class Objectives extends React.Component {
  constructor(props) {
    super(props);
    this.displayPhase = this.displayPhase.bind(this);
  }
  // This redirection should be removed when the phase 2 will be done
  displayPhase() {
    const slug = { slug: getDiscussionSlug() };
    const { isRedirectionToV1 } = this.props.phase;
    const { timeline } = this.props.debate.debateData;
    const { locale } = this.props.i18n;
    const currentPhaseIdentifier = getCurrentPhaseIdentifier(timeline);
    const phaseName = getPhaseName(timeline, currentPhaseIdentifier, locale).toLowerCase();
    const body = <Translate value="redirectToV1" phaseName={phaseName} />;
    const button = { link: `${get('oldDebate', slug)}`, label: I18n.t('home.accessButton'), internalLink: false };
    const isSeveralPhases = isSeveralIdentifiers(timeline);
    if (isRedirectionToV1) {
      if (isSeveralPhases) {
        displayModal(null, body, true, null, button, true);
        setTimeout(() => {
          window.location = `${get('oldDebate', slug)}`;
        }, 6000);
      } else {
        window.location = `${get('oldDebate', slug)}`;
      }
    } else {
      browserHistory.push(`${get('debate', slug)}`);
    }
  }
  render() {
    const { debateData } = this.props.debate;
    return (
      <section className="home-section objectives-section">
        <Grid fluid>
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                <Translate value="home.objectivesTitle" />
              </h1>
            </div>
            <div className="content-section">
              <div className="content-margin">
                <Row>
                  <Col xs={12} sm={12} md={6} className="objectives">
                    <div className="text-column">
                      <div className="top-column">&nbsp;</div>
                      {debateData.objectives}
                    </div>
                  </Col>
                  <Col xs={12} sm={6} md={3} className="objectives">
                    {debateData.objectivesBackground &&
                      <div className="objectives-img" style={{ backgroundImage: `url(${debateData.objectivesBackground.img1Url})` }}>&nbsp;</div>
                    }
                  </Col>
                  <Col xs={12} sm={6} md={3} className="objectives">
                    {debateData.objectivesBackground &&
                      <div className="objectives-img" style={{ backgroundImage: `url(${debateData.objectivesBackground.img2Url})` }}>&nbsp;</div>
                    }
                  </Col>
                </Row>
              </div>
              <div className="center inline full-size margin-xxl">
                <Button onClick={this.displayPhase} className="button-submit button-dark">
                  <Translate value="home.accessButton" />
                </Button>
              </div>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    phase: state.phase,
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(Objectives);