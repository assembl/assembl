import React from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { get } from './utils/routeMap';
import { getDiscussionId, getConnectedUserId, getConnectedUserName } from './utils/globalFunctions';
import { getCurrentPhaseIdentifier } from './utils/timeline';
import { fetchDebateData } from './actions/debateActions';
import { addContext } from './actions/contextActions';
import Loader from './components/common/loader';
import Error from './components/common/error';

class App extends React.Component {
  constructor(props) {
    super(props);
    const debateId = getDiscussionId();
    const connectedUserId = getConnectedUserId();
    const connectedUserName = getConnectedUserName();
    this.props.fetchDebateData(debateId);
    this.props.addContext(this.props.route.path, debateId, connectedUserId, connectedUserName);
  }

  componentDidUpdate() {
    const { debate, location, params } = this.props;
    if (!params.phase && !debate.debateLoading && location.pathname.split('/').indexOf('debate') > -1) {
      const currentPhaseIdentifier = getCurrentPhaseIdentifier(debate.debateData.timeline);
      browserHistory.push(get('debate', { slug: params.slug, phase: currentPhaseIdentifier }));
    }
  }

  render() {
    const { debateData, debateLoading, debateError } = this.props.debate;
    return (
      <div className="app">
        {debateLoading && <Loader />}
        {debateData && <div className="app-child">{this.props.children}</div>}
        {debateError && <Error errorMessage={debateError} />}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  debate: state.debate
});

const mapDispatchToProps = dispatch => ({
  fetchDebateData: (debateId) => {
    dispatch(fetchDebateData(debateId));
  },
  addContext: (path, debateId, connectedUserId, connectedUserName) => {
    dispatch(addContext(path, debateId, connectedUserId, connectedUserName));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(App);