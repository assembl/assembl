import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';

import Statistic from './header/statistic';
import ParticipateButton from '../common/participateButton';
import { get } from '../../utils/routeMap';
import { getCurrentPhaseData } from '../../utils/timeline';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { browserHistory } from '../../router';
import manageErrorAndLoading from '../common/manageErrorAndLoading';
import DiscussionQuery from '../../graphql/DiscussionQuery.graphql';

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.displayPhase = this.displayPhase.bind(this);
  }

  displayPhase() {
    const slug = { slug: getDiscussionSlug() };
    const { timeline } = this.props;
    const { currentPhaseIdentifier } = getCurrentPhaseData(timeline);
    browserHistory.push(get('debate', { ...slug, phase: currentPhaseIdentifier }));
  }

  render() {
    const { timeline, data: { discussion: {
      title, subtitle, headerImage, logoImage, buttonLabel, startDate, endDate } } } = this.props;
    return (
      <section className="home-section header-section">
        <Grid fluid className="max-container">
          <div className="header-content">
            {logoImage && logoImage.externalUrl ? <img className="header-logo" src={logoImage.externalUrl} alt="logo" /> : null}
            <div className="max-text-width">
              {title && <h1 className="light-title-1">{title}</h1>}
              <h4 className="light-title-4 uppercase margin-m">
                {subtitle && <span dangerouslySetInnerHTML={{ __html: subtitle }} />}
                {startDate && endDate && (
                  <div>
                    <Translate
                      value="home.from_start_to_end"
                      start={I18n.l(startDate, { dateFormat: 'date.format' })}
                      end={I18n.l(endDate, { dateFormat: 'date.format' })}
                    />
                  </div>
                )}
              </h4>
              <div className="margin-l">
                <ParticipateButton
                  displayPhase={this.displayPhase}
                  timeline={timeline}
                  btnClass="light"
                  btnLabel={buttonLabel || null}
                />
              </div>
            </div>
          </div>
        </Grid>
        <Grid fluid>
          <Row>
            <Statistic />
            {headerImage && headerImage.externalUrl ? (
              <div className="header-bkg" style={{ backgroundImage: `url(${headerImage.externalUrl})` }}>
                &nbsp;
              </div>
            ) : (
              <div className="header-bkg">&nbsp;</div>
            )}
          </Row>
        </Grid>
      </section>
    );
  }
}

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  timeline: state.timeline
});

export default compose(
  connect(mapStateToProps),
  graphql(DiscussionQuery),
  manageErrorAndLoading({ displayLoader: false }))(Header);