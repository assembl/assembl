import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import { compose, graphql } from 'react-apollo';
import { filter } from 'graphql-anywhere';

import { get } from './utils/routeMap';
import { getDiscussionId, getConnectedUserId, getConnectedUserName } from './utils/globalFunctions';
import { getCurrentPhaseData } from './utils/timeline';
import { fetchDebateData } from './actions/debateActions';
import { addContext } from './actions/contextActions';
import { updateTimeline } from './actions/timelineActions';
import manageErrorAndLoading from './components/common/manageErrorAndLoading';
import Loader from './components/common/loader';
import Error from './components/common/error';
import ChatFrame from './components/common/ChatFrame';
import { browserHistory } from './router';
import TimelineQuery from './graphql/Timeline.graphql';

export const IsHarvestingContext = React.createContext(false);

class App extends React.Component {
  componentDidMount() {
    const debateId = getDiscussionId();
    const connectedUserId = getConnectedUserId();
    const connectedUserName = getConnectedUserName();
    this.props.fetchDebateData(debateId);
    this.props.addContext(this.props.route.path, debateId, connectedUserId, connectedUserName);

    const { location, params, timeline, putTimelineInStore } = this.props;

    putTimelineInStore(timeline);
    if (!params.phase && location.pathname.split('/').indexOf('debate') > -1) {
      const { currentPhaseIdentifier } = getCurrentPhaseData(timeline);
      browserHistory.push(get('debate', { slug: params.slug, phase: currentPhaseIdentifier }));
    }
  }

  componentDidUpdate(prevProps) {
    const { location, params, timeline, putTimelineInStore } = this.props;
    // Don't do a timeline identity check (we are sure it's always different here) but use isEqual to be sure
    // we don't change the redux store (and trigger a full rerendering) if timeline array didn't change.
    if (!isEqual(timeline, prevProps.timeline)) {
      putTimelineInStore(timeline);
    }
    if (!params.phase && location.pathname.split('/').indexOf('debate') > -1) {
      const { currentPhaseIdentifier } = getCurrentPhaseData(timeline);
      browserHistory.push(get('debate', { slug: params.slug, phase: currentPhaseIdentifier }));
    }
  }

  render() {
    const { debateData, debateError, debateLoading } = this.props.debate;
    const divClassNames = classNames('app', { 'harvesting-mode-on': this.props.isHarvesting });
    return (
      <div className={divClassNames}>
        <ChatFrame />
        {debateLoading && <Loader />}
        {debateData && (
          <div className="app-child">
            <IsHarvestingContext.Provider value={this.props.isHarvesting}>{this.props.children}</IsHarvestingContext.Provider>
          </div>
        )}
        {debateError && <Error errorMessage={debateError} />}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  i18n: state.i18n,
  debate: state.debate,
  isHarvesting: state.context.isHarvesting
});

const mapDispatchToProps = dispatch => ({
  fetchDebateData: (debateId) => {
    dispatch(fetchDebateData(debateId));
  },
  addContext: (path, debateId, connectedUserId, connectedUserName) => {
    dispatch(addContext(path, debateId, connectedUserId, connectedUserName));
  },
  putTimelineInStore: (timeline) => {
    dispatch(updateTimeline(timeline));
  }
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(TimelineQuery, {
    options: ({ i18n: { locale } }) => ({
      variables: { lang: locale }
    }),
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading,
          timeline: []
        };
      }

      const filteredPhases = filter(TimelineQuery, { timeline: data.timeline });
      const phasesForStore = filteredPhases.timeline.map(phase => ({
        id: phase.id,
        identifier: phase.identifier,
        isThematicsTable: phase.isThematicsTable,
        start: phase.start,
        end: phase.end,
        image: phase.image,
        title: phase.title,
        description: phase.description
      }));
      return {
        error: data.error,
        loading: data.loading,
        timeline: phasesForStore
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: true })
)(App);