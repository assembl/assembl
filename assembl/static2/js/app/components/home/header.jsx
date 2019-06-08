// @flow
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

type Props = {
  timeline: Timeline,
  title: string,
  subtitle: string,
  headerImage: FileDocument,
  logoImage: FileDocument,
  buttonLabel?: ?string,
  startDate: string,
  endDate: string
};

const Header = ({ timeline, title, subtitle, headerImage, logoImage, buttonLabel, startDate, endDate }: Props) => {
  const displayPhase = () => {
    const slug = { slug: getDiscussionSlug() };
    const { currentPhaseIdentifier } = getCurrentPhaseData(timeline);
    browserHistory.push(get('debate', { ...slug, phase: currentPhaseIdentifier }));
  };

  return (
    <section className="home-section header-section">
      <Grid fluid className="max-container header-content-container">
        <div className="header-content">
          <pre>DEBUG CICD</pre>
          {logoImage && logoImage.externalUrl ? <img className="header-logo" src={logoImage.externalUrl} alt="logo" /> : null}
          <div className="max-text-width">
            {title ? <h1 className="light-title-1">{title}</h1> : null}
            <h4 className="light-title-4 uppercase margin-m">
              {subtitle ? <span dangerouslySetInnerHTML={{ __html: subtitle }} /> : null}
              {startDate && endDate ? (
                <div>
                  <Translate
                    value="home.from_start_to_end"
                    start={I18n.l(startDate, { dateFormat: 'date.format' })}
                    end={I18n.l(endDate, { dateFormat: 'date.format' })}
                  />
                </div>
              ) : null}
            </h4>
            <div className="margin-l">
              <ParticipateButton displayPhase={displayPhase} timeline={timeline} btnClass="light" btnLabel={buttonLabel} />
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
};

Header.defaultProps = {
  buttonLabel: null
};

const mapStateToProps = state => ({
  timeline: state.timeline,
  i18n: state.i18n
});

export default compose(
  connect(mapStateToProps),
  graphql(DiscussionQuery, {
    options: ({ i18n }) => ({
      variables: {
        lang: i18n.locale
      }
    }),
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      const { title, subtitle, headerImage, logoImage, buttonLabel, startDate, endDate } = data.discussion;

      return {
        error: data.error,
        loading: data.loading,
        buttonLabel: buttonLabel,
        title: title,
        subtitle: subtitle,
        headerImage: headerImage,
        logoImage: logoImage,
        startDate: startDate,
        endDate: endDate
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: false })
)(Header);