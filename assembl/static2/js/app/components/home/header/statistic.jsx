// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { Translate, I18n } from 'react-redux-i18n';
import moment from 'moment';
import 'moment-duration-format'; // needed for momentDuration.format()
import RootIdeaStats from '../../../graphql/RootIdeaStats.graphql';
import withLoadingIndicator from '../../../components/common/withLoadingIndicator';

type StatisticElementProps = {
  iconName: string,
  metricValue: string,
  metricNameTranslateKey: string
};

const StatisticElement = (props: StatisticElementProps) => (
  <div className="stat-container">
    <div className="stat-box">
      <div className={`stat-icon assembl-icon-${props.iconName} white`} />
      <div className="stat">
        <div className="stat-nb">{props.metricValue}</div>
        <div className="stat-nb stat-label">
          <Translate value={props.metricNameTranslateKey} />
        </div>
      </div>
    </div>
  </div>
);

class Statistic extends React.Component {
  static mapElementsPropsToComponents = elemsProps =>
    elemsProps.map((elementProps, index) => <StatisticElement key={index} {...elementProps} />);

  render() {
    const { rootIdea, numParticipants, totalSentiments, visitsAnalytics } = this.props.data;
    const elementsProps = [
      { iconName: 'sentiment-neutral', metricValue: totalSentiments, metricNameTranslateKey: 'home.sentiments' },
      { iconName: 'profil', metricValue: numParticipants, metricNameTranslateKey: 'home.participant' }
    ];
    if (rootIdea) {
      elementsProps.push({
        iconName: 'message',
        metricValue: rootIdea.numPosts,
        metricNameTranslateKey: 'home.contribution'
      });
    }

    if (visitsAnalytics) {
      if ('sumVisitsLength' in visitsAnalytics && visitsAnalytics.sumVisitsLength > 0) {
        const totalSeconds = visitsAnalytics.sumVisitsLength;
        // Second parameter of parseInt() is mandatory, see
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt
        const secondsAsNumber = parseInt(totalSeconds, 10);
        const momentDuration = moment.duration(secondsAsNumber, 'seconds');
        const formatValue = I18n.t('duration.format');
        const readableDuration = momentDuration.format(formatValue);
        elementsProps.push({
          iconName: 'timer',
          metricValue: readableDuration,
          metricNameTranslateKey: 'home.sumVisitsLength'
        });
      }
      if ('nbPageviews' in visitsAnalytics && visitsAnalytics.nbPageviews > 0) {
        elementsProps.push({
          iconName: 'double-page',
          metricValue: visitsAnalytics.nbPageviews,
          metricNameTranslateKey: 'home.pageViews'
        });
      }
    }
    return (
      <div className="statistic">
        <div className="intermediary-container">{Statistic.mapElementsPropsToComponents(elementsProps)}</div>
      </div>
    );
  }
}

export default compose(graphql(RootIdeaStats), withLoadingIndicator({ textHidden: true, color: 'white' }))(Statistic);