// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type StatisticElementProps = {
  iconName: string,
  metricValue: number | string,
  metricNameTranslateKey: string
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
  iconName: 'sentiment-neutral',
  metricValue: numParticipations,
  metricNameTranslateKey: 'home.participations'
});

const StatisticElement = (props: StatisticElementProps) => (
  <div className="stat-container">
    <div className="stat-box">
      <div className={`stat-icon assembl-icon-${props.iconName} white`} />
      <div className="stat">
        <div className="stat-nb">{props.metricValue}</div>
        <div className="stat-nb stat-label">
          <Translate value={props.metricNameTranslateKey} count={props.metricValue} />
        </div>
      </div>
    </div>
  </div>
);

const mapElementsPropsToComponents = elemsProps =>
  elemsProps.map((elementProps, index) => <StatisticElement key={index} {...elementProps} />);

const HeaderStatistics = ({ statElements }: { statElements: StatElements }) => (
  <div className="statistic">
    <div className="intermediary-container">{mapElementsPropsToComponents(statElements)}</div>
  </div>
);

export default HeaderStatistics;