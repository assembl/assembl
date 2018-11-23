// @flow
import * as React from 'react';
import { compose, graphql } from 'react-apollo';
import { I18n } from 'react-redux-i18n';
import moment from 'moment';
import 'moment-duration-format'; // needed for momentDuration.format()
import RootIdeaStatsQuery from '../../../graphql/RootIdeaStats.graphql';
import manageErrorAndLoading from '../../../components/common/manageErrorAndLoading';
import HeaderStatistics, { statMessages, statParticipants, statSentiments } from '../../../components/common/headerStatistics';

export type VisitsAnalytics = {
  nbPageviews: ?number,
  npUniqPageviews: ?number,
  sumVisitsLength: ?number,
  __typename?: 'VisitsAnalytics'
};

type Props = {
  rootIdea: Idea,
  numParticipants: number,
  totalSentiments: number,
  totalVoteSessionParticipations: number,
  visitsAnalytics: VisitsAnalytics
};

class Statistic extends React.PureComponent<Props> {
  render() {
    const { rootIdea, numParticipants, totalSentiments, totalVoteSessionParticipations, visitsAnalytics } = this.props;
    const { sumVisitsLength, nbPageviews } = visitsAnalytics;
    const statElements = [statSentiments(totalSentiments + totalVoteSessionParticipations), statParticipants(numParticipants)];
    if (rootIdea) {
      statElements.push(statMessages(rootIdea.numPosts));
    }

    if (visitsAnalytics) {
      if (sumVisitsLength && sumVisitsLength > 0) {
        const totalSeconds = sumVisitsLength;
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
      if (nbPageviews && nbPageviews > 0) {
        statElements.push({
          iconName: 'double-page',
          metricValue: nbPageviews,
          metricNameTranslateKey: 'home.pageViews'
        });
      }
    }
    return <HeaderStatistics statElements={statElements} />;
  }
}

export default compose(
  graphql(RootIdeaStatsQuery, {
    props: ({
      data: { rootIdea, numParticipants, totalSentiments, visitsAnalytics, loading, error, totalVoteSessionParticipations }
    }) => {
      if (error || loading) {
        return {
          error: error,
          loading: loading
        };
      }
      return {
        rootIdea: rootIdea,
        numParticipants: numParticipants,
        totalSentiments: totalSentiments,
        visitsAnalytics: visitsAnalytics,
        totalVoteSessionParticipations: totalVoteSessionParticipations
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: false, textHidden: true, color: 'white' })
)(Statistic);