import React from 'react';
import { connect } from 'react-redux';
import { fetchSynthesis } from './actions/synthesisActions';
import { fetchPosts } from './actions/postsActions';
import { fetchUsers } from './actions/usersActions';
import Navbar from './components/common/navbar';
import Footer from './components/common/footer';

class Main extends React.Component {
  componentWillMount() {
    const { debateId, connectedUserId } = this.props.context;
    this.props.fetchPosts(debateId);
    this.props.fetchSynthesis(debateId);
    this.props.fetchUsers(debateId, connectedUserId);
  }
  render() {
    return (
      <div className="main">
        <Navbar />
        <div className="app-content">{this.props.children}</div>
        <Footer />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    context: state.context
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchPosts: (debateId) => {
      dispatch(fetchPosts(debateId));
    },
    fetchUsers: (debateId, connectedUserId) => {
      dispatch(fetchUsers(debateId, connectedUserId));
    },
    fetchSynthesis: (debateId) => {
      dispatch(fetchSynthesis(debateId));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Main);