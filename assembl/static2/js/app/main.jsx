import React from 'react';
import { connect } from 'react-redux';
import { getCurrentPhaseIdentifier } from './utils/timeline';
import { fetchSynthesis } from './actions/synthesisActions';
import { fetchPosts } from './actions/postsActions';
import { fetchUsers } from './actions/usersActions';
import Navbar from './components/common/navbar';
import Footer from './components/common/footer';

class Main extends React.Component {
  constructor(props) {
    super(props);
    const { debateData } = this.props.debate;
    const paramsIdentifier = this.props.params.phase || getCurrentPhaseIdentifier(debateData.timeline);
    const queryIdentifier = this.props.location.query.phase || paramsIdentifier;
    this.state = {
      identifier: queryIdentifier
    };
  }
  componentWillMount() {
    const { debateId, connectedUserId } = this.props.context;
    this.props.fetchPosts(debateId);
    this.props.fetchSynthesis(debateId);
    this.props.fetchUsers(debateId, connectedUserId);
  }
  componentWillReceiveProps(nextProps) {
    const { debateData } = this.props.debate;
    const paramsIdentifier = nextProps.params.phase || getCurrentPhaseIdentifier(debateData.timeline);
    const queryIdentifier = nextProps.location.query.phase || paramsIdentifier;
    this.state = {
      identifier: queryIdentifier
    };
  }
  render() {
    const that = this;
    const children = React.Children.map(this.props.children, (child) => {
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