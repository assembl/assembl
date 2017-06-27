import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { getPhaseName, getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';

class Header extends React.Component {
  render() {
    const { title, imgUrl, identifier } = this.props;
    const { debateData } = this.props.debate;
    const { locale } = this.props.i18n;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, 'survey');
    const closedPhaseName = getPhaseName(debateData.timeline, identifier, locale).toLowerCase();
    return (
      <section className="header-section">
        <Grid fluid className="max-container">
          <div className="header-content">
            <h1 className="light-title-1">
              {title}
            </h1>
            {isPhaseCompleted &&
              <h6 className="light-title-6"><Translate value="debate.survey.endPhase" closedPhaseName={closedPhaseName} /></h6>}
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