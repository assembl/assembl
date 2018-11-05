// @flow
import * as React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { getIsPhaseCompletedById, getPhaseName } from '../../utils/timeline';
import WhatYouNeedToKnow from '../debate/common/whatYouNeedToKnow';
import HeaderActions from '../debate/common/headerActions';
import { type DebateType } from '../debate/navigation/timelineSegment';

type Props = {
  children: React.Node,
  title: string,
  subtitle: string,
  phaseId?: string,
  imgUrl: ?string,
  synthesisTitle?: string,
  additionalHeaderClasses: string,
  type: string,
  debate: DebateType,
  timeline: Timeline
};

class Header extends React.Component<Props> {
  render() {
    const { children, title, subtitle, imgUrl, phaseId, synthesisTitle, additionalHeaderClasses, type, timeline } = this.props;
    const { debateData } = this.props.debate;
    let isPhaseCompleted = false;
    let closedPhaseName = '';
    if (phaseId) {
      isPhaseCompleted = getIsPhaseCompletedById(timeline, phaseId);
      if (isPhaseCompleted) {
        closedPhaseName = getPhaseName(timeline, phaseId).toLowerCase();
      }
    }

    const titleClassNames = classnames([additionalHeaderClasses], 'light-title-7');
    return (
      <div className="header-section-container">
        <section className="header-section">
          <Grid fluid className="max-container">
            <div className="header-content">
              <h1 className={titleClassNames}>{title}</h1>
              <h3 className="light-title-2">{subtitle}</h3>
              {isPhaseCompleted && (
                <h6 className="light-title-4">
                  <Translate value="debate.survey.endPhase" closedPhaseName={closedPhaseName} />
                </h6>
              )}
            </div>
            {type ? <HeaderActions useSocialMedia={debateData.useSocialMedia} type={type} /> : null}
          </Grid>
          <Grid fluid>
            <Row>
              {children}
              <div className="header-bkg" style={imgUrl ? { backgroundImage: `url(${imgUrl})` } : null}>
                &nbsp;
              </div>
              <div className="header-bkg-mask">&nbsp;</div>
            </Row>
          </Grid>
        </section>
        {synthesisTitle && <WhatYouNeedToKnow synthesisTitle={synthesisTitle} />}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  debate: state.debate,
  timeline: state.timeline
});

export default connect(mapStateToProps)(Header);