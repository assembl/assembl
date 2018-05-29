// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { formatNumber } from '../../../app/utils/globalFunctions';

type StatisticElementProps = {
  iconName: string,
  metricValue: number | string,
  metricNameTranslateKey: string,
  lang: string
};

type StatElements = Array<StatisticElementProps>;

export const statContributions = (numContributions: number) => ({
  iconName: 'sentiment-neutral',
  metricValue: numContributions,
  metricNameTranslateKey: 'home.contribution'
});

export const statMessages = (numPosts: number) => ({
  iconName: 'message',
  metricValue: numPosts,
  metricNameTranslateKey: 'home.messages'
});

export const statParticipants = (numParticipants: number) => ({
  iconName: 'profil',
  metricValue: numParticipants,
  metricNameTranslateKey: 'home.participant'
});

export const statSentiments = (totalSentiments: number) => ({
  iconName: 'sentiment-neutral',
  metricValue: totalSentiments,
  metricNameTranslateKey: 'home.sentiments'
});

export const statParticipations = (numParticipations: number) => ({
  iconName: 'participation-vote',
  metricValue: numParticipations,
  metricNameTranslateKey: 'home.participations'
});

const StatisticElement = ({ metricNameTranslateKey, iconName, metricValue, lang }: StatisticElementProps) => (
  <div className="stat-container">
    <div className="stat-box">
      <div className={`stat-icon assembl-icon-${iconName} white`} />
      <div className="stat">
        <div className="stat-nb">{formatNumber(metricValue, lang)}</div>
        <div className="stat-nb stat-label">
          <Translate value={metricNameTranslateKey} count={metricValue} />
        </div>
      </div>
    </div>
  </div>
);

const mapElementsPropsToComponents = (elemsProps, lang) =>
  elemsProps.map((elementProps, index) => <StatisticElement key={`stat-${index}`} {...elementProps} lang={lang} />);

export const DumbHeaderStatistics = ({ statElements }: { statElements: StatElements }, { lang }: StatisticElementProps) => (
  <div className="statistic">
    <div className="intermediary-container">{mapElementsPropsToComponents(statElements, lang)}</div>
  </div>
);

const mapStateToProps = state => ({
  lang: state.i18n.locale
});

export default connect(mapStateToProps)(DumbHeaderStatistics);