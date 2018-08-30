import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';

import Statistic from './header/statistic';
import ParticipateButton from '../common/participateButton';
import { get } from '../../utils/routeMap';
import { getCurrentPhaseIdentifier } from '../../utils/timeline';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { browserHistory } from '../../router';

class Header extends React.Component {
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
    const { locale } = this.props.i18n;
    const { timeline } = this.props;
    return (
      <section className="home-section header-section">
        <Grid fluid className="max-container">
          <div className="header-content">
            {debateData.headerLogoUrl ? <img className="header-logo" src={debateData.headerLogoUrl} alt="logo" /> : null}
            <div className="max-text-width">
              {debateData.topic && <h1 className="light-title-1">{debateData.topic.titleEntries[locale]}</h1>}
              <h4 className="light-title-4 uppercase margin-m">
                {debateData.introduction && <span>{debateData.introduction.titleEntries[locale]}</span>}
                {debateData.dates && (
                  <div>
                    <Translate
                      value="home.from_start_to_end"
                      start={I18n.l(debateData.dates.startDate, { dateFormat: 'date.format' })}
                      end={I18n.l(debateData.dates.endDate, { dateFormat: 'date.format' })}
                    />
                  </div>
                )}
              </h4>
              <div className="margin-l">
                <ParticipateButton displayPhase={this.displayPhase} timeline={timeline} btnClass="light" />
              </div>
            </div>
          </div>
        </Grid>
        <Grid fluid>
          <Row>
            <Statistic />
            <div className="header-bkg" style={{ backgroundImage: `url(${debateData.headerBackgroundUrl})` }}>
              &nbsp;
            </div>
          </Row>
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

export default connect(mapStateToProps)(Header);