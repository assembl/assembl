import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { getPhaseName, getIfPhaseCompletedByIdentifier } from '../../utils/timeline';
import WhatYouNeedToKnow from '../debate/common/whatYouNeedToKnow';

class Header extends React.Component {
  render() {
    const { title, imgUrl, identifier, synthesisTitle, isSynthesesHeader } = this.props;
    const { debateData } = this.props.debate;
    const { locale } = this.props.i18n;
    const additionalHeaderClasses = isSynthesesHeader ? 'left' : null;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, identifier);
    const closedPhaseName = getPhaseName(debateData.timeline, identifier, locale).toLowerCase();
    const titleClassNames = classnames([additionalHeaderClasses], 'light-title-1');
    return (
      <section className="header-section">
        <Grid fluid className="max-container">
          <div className="header-content">
            <h1 className={titleClassNames}>{title}</h1>
            {isPhaseCompleted && (
              <h6 className="light-title-6">
                <Translate value="debate.survey.endPhase" closedPhaseName={closedPhaseName} />
              </h6>
            )}
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
        {synthesisTitle && <WhatYouNeedToKnow synthesisTitle={synthesisTitle} />}
      </section>
    );
  }
}

const mapStateToProps = state => ({
  debate: state.debate,
  i18n: state.i18n
});

export default connect(mapStateToProps)(Header);