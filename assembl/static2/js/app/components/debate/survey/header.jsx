import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { getPhaseName, getCurrentPhaseIdentifier, getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import { get } from '../../../utils/routeMap';

class Header extends React.Component {
  render() {
    const { title, imgUrl } = this.props;
    const { debateData } = this.props.debate;
    const slug = { slug: debateData.slug };
    const { locale } = this.props.i18n;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, 'survey');
    const surveyPhaseName = getPhaseName(debateData.timeline, 'survey', locale).toLowerCase();
    const currentPhaseIdentifier = getCurrentPhaseIdentifier(debateData.timeline);
    const currentPhaseName = getPhaseName(debateData.timeline, currentPhaseIdentifier, locale).toLowerCase();
    return (
      <section className="header-section">
        <Grid fluid className="max-container">
          <div className="header-content">
            <h1 className="light-title-1">{isPhaseCompleted ? <Translate value="debate.survey.endPhase" closedPhaseName={surveyPhaseName} /> : title}</h1>
            <Link to={`${get('debate', slug)}`}>{isPhaseCompleted ? <Translate value="debate.survey.goTo" currentPhaseName={currentPhaseName} /> : ''}</Link>
          </div>
        </Grid>
        <Grid fluid>
          <Row>
            <div className="header-bkg" style={{ backgroundImage: `url(${imgUrl})` }}>&nbsp;</div>
          </Row>
        </Grid>
      </section>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(Header);