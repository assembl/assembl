import React from 'react';
import { connect } from 'react-redux';
import { isDateExpired } from './utils/globalFunctions';
import { fetchSynthesis } from './actions/synthesisActions';
import { fetchPosts } from './actions/postsActions';
import { fetchUsers } from './actions/usersActions';
import Navbar from './components/common/navbar';
import Footer from './components/common/footer';

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      identifier: this.getCurrentPhaseIdentifier()
    };
  }
  componentWillMount() {
    const { debateId, connectedUserId } = this.props.context;
    this.props.fetchPosts(debateId);
    this.props.fetchSynthesis(debateId);
    this.props.fetchUsers(debateId, connectedUserId);
  }
  render() {
    const that = this;
    const children = React.Children.map(this.props.children, function (child) {
      return React.cloneElement(child, {
        identifier: that.state.identifier
      });
    });
    return (
      <div className="main">
        <Navbar />
        <div className="app-content">{children}</div>
        <Footer />
      </div>
    );
  }
  getCurrentPhaseIdentifier() {
    const currentDate = new Date();
    const { debateData } = this.props.debate;
    let identifier = null;
    if (debateData.timeline) {
      debateData.timeline.map((phase) => {
        const startDate = new Date(phase.start);
        const endDate = new Date(phase.end);
        if (isDateExpired(currentDate, startDate) && isDateExpired(endDate, currentDate)) {
          identifier = phase.identifier;
        }
        return identifier;
      });
    }
    return identifier || 'thread';
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
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