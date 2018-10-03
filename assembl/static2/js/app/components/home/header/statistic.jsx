// @noflow
import * as React from 'react';
import { compose, graphql } from 'react-apollo';
import { I18n } from 'react-redux-i18n';
import moment from 'moment';
import 'moment-duration-format'; // needed for momentDuration.format()
import RootIdeaStats from '../../../graphql/RootIdeaStats.graphql';
import manageErrorAndLoading from '../../../components/common/manageErrorAndLoading';
import HeaderStatistics, { statMessages, statParticipants, statSentiments } from '../../../components/common/headerStatistics';

class Statistic extends React.Component<$FlowFixMeProps> {
  render() {
    const { rootIdea, numParticipants, totalSentiments, visitsAnalytics } = this.props.data;
    const statElements = [statSentiments(totalSentiments), statParticipants(numParticipants)];
    if (rootIdea) {
      statElements.push(statMessages(rootIdea.numPosts));
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
        statElements.push({
          iconName: 'timer',
          metricValue: readableDuration,
          metricNameTranslateKey: 'home.sumVisitsLength'
        });
      }
      if ('nbPageviews' in visitsAnalytics && visitsAnalytics.nbPageviews > 0) {
        statElements.push({
          iconName: 'double-page',
          metricValue: visitsAnalytics.nbPageviews,
          metricNameTranslateKey: 'home.pageViews'
        });
      }
    }
    return <HeaderStatistics statElements={statElements} />;
  }
}

export default compose(graphql(RootIdeaStats), manageErrorAndLoading({ textHidden: true, color: 'white' }))(Statistic);