// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import RootIdeaStats from '../../../graphql/RootIdeaStats.graphql';
import withLoadingIndicator from '../../../components/common/withLoadingIndicator';

const indexIsLast = (index, array) => {
  return index === array.length - 1;
};

class Statistic extends React.Component {
  static Element = ({ iconName, count, translateValue, isLast, width }) => {
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
            <div className="stat-nb">{count}&nbsp;</div>
            <div className="stat-nb">
              <Translate value={translateValue} />
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
      { iconName: 'sentiment-neutral', count: totalSentiments, translateValue: 'home.sentiments' },
      { iconName: 'profil', count: numParticipants, translateValue: 'home.participant' }
    ];
    if (rootIdea) {
      elementsProps.push({
        iconName: 'message',
        count: rootIdea.numPosts,
        translateValue: 'home.contribution'
      });
    }

    if (visitsAnalytics) {
      if ('sumVisitsLength' in visitsAnalytics && visitsAnalytics.sumVisitsLength > 0) {
        const totalSeconds = visitsAnalytics.sumVisitsLength;
        const totalSecondsToReadableDuration = function (seconds) {
          const secondsAsNumber = parseInt(seconds, 10); // don't forget the second param
          let hours = Math.floor(secondsAsNumber / 3600);
          let minutes = Math.floor((secondsAsNumber - hours * 3600) / 60);
          let secondsRemaining = secondsAsNumber - hours * 3600 - minutes * 60;

          if (hours < 10) {
            hours = `0${hours}`;
          }
          if (minutes < 10) {
            minutes = `0${minutes}`;
          }
          if (seconds < 10) {
            secondsRemaining = `0${secondsRemaining}`;
          }
          return `${hours}h ${minutes}m ${secondsRemaining}s`;
        };
        const readableDuration = totalSecondsToReadableDuration(totalSeconds);
        elementsProps.push({
          iconName: 'sentiment-neutral', // TODO: use the right icon
          count: readableDuration,
          translateValue: 'home.sumVisitsLength'
        });
      }
      if ('nbPageviews' in visitsAnalytics && visitsAnalytics.nbPageviews > 0) {
        elementsProps.push({
          iconName: 'sentiment-neutral', // TODO: use the right icon
          count: visitsAnalytics.nbPageviews,
          translateValue: 'home.pageViews'
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