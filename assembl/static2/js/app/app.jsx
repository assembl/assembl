import React from 'react';
import { connect } from 'react-redux';
import { getDiscussionId, getConnectedUserId, getConnectedUserName } from './utils/globalFunctions';
import { fetchDebateData } from './actions/debateActions';
import { addContext } from './actions/contextActions';
import Loader from './components/common/loader';
import Error from './components/common/error';
import AlertManager from './utils/alert';
import Alert from './components/common/alert';

class App extends React.Component {
  constructor(props) {
    super(props);
    const debateId = getDiscussionId();
    const connectedUserId = getConnectedUserId();
    const connectedUserName = getConnectedUserName();
    this.props.fetchDebateData(debateId);
    this.props.addContext(this.props.route.path, debateId, connectedUserId, connectedUserName);
  }
  render() {
    const { debateData, debateLoading, debateError } = this.props.debate;
    return (
      <div className="app">
        {debateLoading && <Loader />}
        {debateData &&
          <div>
            <Alert isBase ref={(alertComponent) => AlertManager.setComponent(alertComponent)}/>
            <div className="app-child">{this.props.children}</div>
          </div>
        }
        {debateError && <Error errorMessage={debateError} />}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchDebateData: (debateId) => {
      dispatch(fetchDebateData(debateId));
    },
    addContext: (path, debateId, connectedUserId, connectedUserName) => {
      dispatch(addContext(path, debateId, connectedUserId, connectedUserName));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);