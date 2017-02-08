import React from 'react';
import { connect } from 'react-redux';
import MapStateToProps from '../store/mapStateToProps';
import MapDispatchToProps from '../store/mapDispatchToProps';
import Navbar from '../components/common/navbar';
import Footer from '../components/common/footer';

class Main extends React.Component {
  componentWillMount() {
    const { debateId } = this.props.context;
    this.props.fetchPosts(debateId);
    this.props.fetchUsers(debateId);
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