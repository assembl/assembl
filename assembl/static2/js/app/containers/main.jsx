import React from 'react';
import { connect } from 'react-redux';
import GlobalFunctions from '../utils/globalFunctions';
import MapStateToProps from '../store/mapStateToProps';
import MapDispatchToProps from '../store/mapDispatchToProps';
import Navbar from '../components/common/navbar';
import Footer from '../components/common/footer';

class Main extends React.Component {
  componentWillMount() {
    const discussionId = GlobalFunctions.getDiscussionId();
    this.props.fetchPosts(discussionId);
    this.props.fetchUsers(discussionId);
  }
  render() {
    return (
      <div>
        <Navbar />
        <div className="app-content">{this.props.children}</div>
        <Footer />
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(Main);