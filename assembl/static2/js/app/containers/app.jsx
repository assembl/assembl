import React from 'react';
import { connect } from 'react-redux';
import GlobalFunctions from '../utils/globalFunctions';
import PathActions from '../actions/pathActions';
import DebateActions from '../actions/debateActions';
import PostsActions from '../actions/postsActions';
import UsersActions from '../actions/usersActions';
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

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n,
    debate: state.debate,
    posts: state.posts,
    users: state.users,
    path: state.path
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchDebateData: (id) => {
      dispatch(DebateActions.fetchDebateData(id));
    },
    fetchPosts: (id) => {
      dispatch(PostsActions.fetchPosts(id));
    },
    fetchUsers: (id) => {
      dispatch(UsersActions.fetchUsers(id));
    },
    addPath: (path) => {
      dispatch(PathActions.addPath(path));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);