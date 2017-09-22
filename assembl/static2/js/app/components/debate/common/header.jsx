import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { getPhaseName, getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import WhatYouNeedToKnow from './whatYouNeedToKnow';

class Header extends React.Component {
  render() {
    const { title, imgUrl, identifier, longTitle } = this.props;
    const { debateData } = this.props.debate;
    const { locale } = this.props.i18n;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, identifier);
    const closedPhaseName = getPhaseName(debateData.timeline, identifier, locale).toLowerCase();
    const titlesArray = title.split('#!');
    let localizedTitle = '';
    titlesArray.forEach((t) => {
      if (t.split('$!')[1] === locale) {
        localizedTitle = t.split('$!')[0];
      }
    });
    return (
      <section className="header-section">
        <Grid fluid className="max-container">
          <div className="header-content">
            <h1 className="light-title-1">
              {localizedTitle}
            </h1>
            {isPhaseCompleted &&
              <h6 className="light-title-6">
                <Translate value="debate.survey.endPhase" closedPhaseName={closedPhaseName} />
              </h6>}
          </div>
        </Grid>
        <Grid fluid>
          <Row>
            <div className="header-bkg" style={imgUrl ? { backgroundImage: `url(${imgUrl})` } : null}>
              &nbsp;
            </div>
            <div className="header-bkg-mask">&nbsp;</div>
          </Row>
        </Grid>
        {longTitle && <WhatYouNeedToKnow longTitle={longTitle} />}
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