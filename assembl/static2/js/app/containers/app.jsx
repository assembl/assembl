import React from 'react';
import { connect } from 'react-redux';
import GlobalFunctions from '../utils/globalFunctions';
import MapStateToProps from '../store/mapStateToProps';
import MapDispatchToProps from '../store/mapDispatchToProps';
import Loader from '../components/common/loader';
import Error from '../components/common/error';
import Navbar from '../components/common/navbar';

class App extends React.Component {
  constructor(props) {
    super(props);
    const discussionId = GlobalFunctions.getDiscussionId();
    this.props.fetchDebateData(discussionId);
    this.props.fetchPosts(discussionId);
    this.props.fetchUsers(discussionId);
    this.props.addPath(this.props.route.path);
  }
  render() {
    const { debateData, debateLoading, debateError } = this.props.debate;
    return (
      <div>
        {debateLoading && <Loader />}
        {debateData &&
          <div>
            <Navbar />
            <div className="app-content">{this.props.children}</div>
          </div>
        }
        {debateError && <Error errorMessage={debateError} />}
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(App);