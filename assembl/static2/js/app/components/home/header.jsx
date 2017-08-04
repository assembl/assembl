import React from 'react';
import { browserHistory } from 'react-router';
import { Translate, I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Grid, Row, Button } from 'react-bootstrap';
import Statistic from './header/statistic';
import Synthesis from './header/synthesis';
import { get } from '../../utils/routeMap';
import { getPhaseName, getCurrentPhaseIdentifier, isSeveralIdentifiers } from '../../utils/timeline';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { displayModal } from '../../utils/utilityManager';

class Header extends React.Component {
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
          window.location = get('oldDebate', slug);
        }, 6000);
      } else {
        window.location = get('oldDebate', slug);
      }
    } else {
      browserHistory.push(get('debate', { ...slug, phase: currentPhaseIdentifier }));
    }
  }
  render() {
    const { debateData } = this.props.debate;
    const { synthesis } = this.props.synthesis;
    const { locale } = this.props.i18n;
    return (
      <section className="home-section header-section">
        <Grid fluid className="max-container">
          <div className="header-content">
            {debateData.headerLogoUrl ? <img className="header-logo" src={debateData.headerLogoUrl} alt="logo" /> : null}
            <div className="max-text-width">
              {debateData.topic &&
                <h1 className="light-title-1">
                  {debateData.topic.titleEntries[locale]}
                </h1>}
              <h4 className="light-title-4 uppercase margin-m">
                {debateData.introduction &&
                  <span>
                    {debateData.introduction.titleEntries[locale]}
                  </span>}
                {debateData.dates &&
                  <div>
                    <Translate
                      value="home.from_start_to_end"
                      start={I18n.l(debateData.dates.startDate, { dateFormat: 'date.format' })}
                      end={I18n.l(debateData.dates.endDate, { dateFormat: 'date.format' })}
                    />
                  </div>}
              </h4>
              <Button onClick={this.displayPhase} className="button-submit button-light margin-xl">
                <Translate value="home.accessButton" />
              </Button>
            </div>
            {synthesis && Object.keys(synthesis.lastPublishedSynthesis).length > 0 && <Synthesis />}
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

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    synthesis: state.synthesis,
    phase: state.phase,
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(Header);