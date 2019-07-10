// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import { type Route } from 'react-router';
import { compose, graphql } from 'react-apollo';
import { filter } from 'graphql-anywhere';
import 'react-dates/initialize'; // required for the react-dates components
import 'react-dates/lib/css/_datepicker.css'; // required for the react-dates components
import { get } from './utils/routeMap';
import { getConnectedUserId, getConnectedUserName, getDiscussionId } from './utils/globalFunctions';
import { getCurrentPhaseData } from './utils/timeline';
import { fetchDebateData } from './actions/debateActions';
import { addContext } from './actions/contextActions';
import { updateTimeline } from './actions/timelineActions';
import Loader from './components/common/loader';
import ErrorMessage from './components/common/error';
import ChatFrame from './components/common/ChatFrame';
import { browserHistory } from './router';
import TimelineQuery from './graphql/Timeline.graphql';
import DiscussionPreferencesQuery from './graphql/DiscussionPreferencesQuery.graphql';
import { MESSAGE_VIEW } from './constants';

type ContextValue = {
  connectedUserId: ?string,
  isHarvestable: boolean,
  isHarvesting: boolean,
  isDebateModerated: boolean,
  messageViewOverride: ?string,
  modifyContext: (newState: Object) => void
};

const defaultContextValue: ContextValue = {
  isDebateModerated: false,
  isHarvesting: false,
  isHarvestable: false,
  modifyContext: () => {},
  connectedUserId: null,
  messageViewOverride: MESSAGE_VIEW.noModule
};

export const DebateContext: React$Context<ContextValue> = React.createContext(defaultContextValue);

type Debate = {
  debateData: DebateData,
  debateLoading: boolean,
  debateError: ?string
};

type Location = {
  action: string,
  hash: string,
  key: string,
  pathname: string,
  query: Object,
  search: string
};

type Params = {
  phase: string,
  slug: string
};

type Props = {
  addContext: Function,
  children: React.Node,
  debate: Debate,
  error?: ?Error,
  fetchDebateData: Function,
  location: Location,
  params: Params,
  putTimelineInStore: Function,
  route: Route,
  timeline: Timeline,
  timelineLoading: boolean,
  isHarvesting: boolean,
  isDebateModerated: boolean,
  connectedUserId: ?string
};

type State = {
  isHarvestable: boolean,
  messageViewOverride: string
};

export class DumbApp extends React.Component<Props, State> {
  state = {
    isHarvestable: false,
    messageViewOverride: MESSAGE_VIEW.noModule
  };

  componentDidMount() {
    const { route } = this.props;
    const debateId = getDiscussionId();
    const connectedUserName = getConnectedUserName();
    const connectedUserId = getConnectedUserId();
    this.props.fetchDebateData(debateId);
    this.props.addContext(route.path, debateId, connectedUserId, connectedUserName);
  }

  componentDidUpdate(prevProps: Props) {
    const { error, timelineLoading, location, params, timeline, putTimelineInStore } = this.props;
    if (error) {
      throw new Error(error.message);
    }

    // Don't do a timeline identity check (we are sure it's always different here) but use isEqual to be sure
    // we don't change the redux store (and trigger a full rerendering) if timeline array didn't change.
    if (!timelineLoading && !isEqual(timeline, prevProps.timeline)) {
      putTimelineInStore(timeline);
    }
    if (!params.phase && !timelineLoading && location.pathname.split('/').indexOf('debate') > -1) {
      const { currentPhaseIdentifier } = getCurrentPhaseData(timeline);
      browserHistory.push(get('debate', { slug: params.slug, phase: currentPhaseIdentifier }));
    }
  }

  render() {
    const { debateData, debateLoading, debateError } = this.props.debate;
    const { isHarvesting, children, isDebateModerated, connectedUserId } = this.props;
    const contextValue: ContextValue = {
      isHarvesting: isHarvesting,
      isHarvestable: this.state.isHarvestable,
      modifyContext: (newState: Object) => this.setState(() => newState),
      isDebateModerated: isDebateModerated,
      connectedUserId: connectedUserId,
      messageViewOverride: this.state.messageViewOverride
    };
    const divClassNames = classNames('app', { 'harvesting-mode-on': isHarvesting });
    return (
      <div className={divClassNames}>
        <ChatFrame />
        {debateLoading && <Loader />}
        {debateData && (
          <div className="app-child">
            <DebateContext.Provider value={contextValue}>{children}</DebateContext.Provider>
          </div>
        )}
        {debateError && <ErrorMessage errorMessage={debateError} />}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  i18n: state.i18n,
  debate: state.debate,
  isHarvesting: state.context.isHarvesting,
  connectedUserId: state.context.connectedUserId
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
      if (data.error) {
        return {
          error: data.error,
          timeline: [],
          timelineLoading: data.loading
        };
      }

      if (data.loading) {
        return {
          error: data.error,
          // Return timeline: null in case of loading, when timeline query is done with no phases,
          // !isEqual(null, []) is true, putTimelineInStore([]) is done and
          // the message "No timeline has been configured yet" appears.
          timeline: null,
          timelineLoading: data.loading
        };
      }

      const filteredPhases = filter(TimelineQuery, { timeline: data.timeline });
      const phasesForStore = filteredPhases.timeline.map(phase => ({
        id: phase.id,
        identifier: phase.identifier,
        start: phase.start,
        end: phase.end,
        image: phase.image,
        title: phase.title,
        description: phase.description
      }));
      return {
        error: data.error,
        timelineLoading: data.loading,
        timeline: phasesForStore
      };
    }
  }),
  graphql(DiscussionPreferencesQuery, {
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading,
          isDebateModerated: false
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        isDebateModerated: data.discussionPreferences.withModeration
      };
    }
  })
)(DumbApp);