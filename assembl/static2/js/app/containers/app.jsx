import React from 'react';
import { connect } from 'react-redux';
import { getDiscussionId, getConnectedUserId } from '../utils/globalFunctions';
import MapStateToProps from '../store/mapStateToProps';
import MapDispatchToProps from '../store/mapDispatchToProps';
import Loader from '../components/common/loader';
import Error from '../components/common/error';

class App extends React.Component {
  constructor(props) {
    super(props);
    const debateId = getDiscussionId();
    const connectedUserId = getConnectedUserId();
    this.props.fetchDebateData(debateId);
    this.props.addContext(this.props.route.path, debateId, connectedUserId);
  }
  render() {
    const { debateData, debateLoading, debateError } = this.props.debate;
    return (
      <div className="app">
        {debateLoading && <Loader />}
        {debateData &&
          <div className="app-child">{this.props.children}</div>
        }
        {debateError && <Error errorMessage={debateError} />}
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(App);