// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { Translate, I18n } from 'react-redux-i18n';
import moment from 'moment';
import 'moment-duration-format'; // needed for momentDuration.format()
import RootIdeaStats from '../../../graphql/RootIdeaStats.graphql';
import withLoadingIndicator from '../../../components/common/withLoadingIndicator';

const indexIsLast = (index, array) => {
  return index === array.length - 1;
};

class Statistic extends React.Component {
  static Element = ({ iconName, metricValue, metricNameTranslateKey, isLast, width }) => {
    return (
      <div
        className={`inline${isLast ? '' : ' border-right'}`}
        style={{
          width: width
        }}
      >
        <div className="stat-box">
          <div className={`stat-icon assembl-icon-${iconName} white`} />
          <div className="stat">
            <div className="stat-nb">{metricValue}&nbsp;</div>
            <div className="stat-nb">
              <Translate value={metricNameTranslateKey} />
            </div>
          </div>
        </div>
      </div>
    );
  };
  static mapElementsPropsToComponents = (elemsProps) => {
    return elemsProps.map((elementProps, index, array) => {
      const elementsWidth = `${100 / array.length}%`;
      return <Statistic.Element key={index} {...elementProps} width={elementsWidth} isLast={indexIsLast(index, array)} />;
    });
  };
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
        const secondsAsNumber = parseInt(totalSeconds, 10); // don't forget the second param
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