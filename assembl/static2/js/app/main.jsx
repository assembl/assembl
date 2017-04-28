import React from 'react';
import { connect } from 'react-redux';
import {
  scrollToPosition,
  getDiscussionId,
  getConnectedUserId,
  getDocumentScrollTop
} from './utils/globalFunctions';
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
      identifier: queryIdentifier,
      location: this.props.location.pathname
    };
    this.displayHeader = this.displayHeader.bind(this);
  }
  componentWillMount() {
    const discussionId = getDiscussionId();
    const connectedUserId = getConnectedUserId();
    this.props.fetchPosts(discussionId);
    this.props.fetchSynthesis(discussionId);
    this.props.fetchUsers(discussionId, connectedUserId);
  }
  componentDidMount() {
    window.addEventListener('scroll', this.displayHeader);
  }
  componentWillReceiveProps(nextProps) {
    const location = nextProps.location.pathname;
    const { debateData } = this.props.debate;
    const paramsIdentifier = nextProps.params.phase || getCurrentPhaseIdentifier(debateData.timeline);
    const queryIdentifier = nextProps.location.query.phase || paramsIdentifier;
    this.setState({
      identifier: queryIdentifier,
      isNavbarHidden: false,
      location: location
    });

    scrollToPosition(0, 0);
  }
  componentWillUnmount() {
    window.removeEventListener('scroll', this.displayHeader);
  }
  displayHeader() {
    const isDebateView = this.props.location.pathname.indexOf('debate') > -1;
    const top = getDocumentScrollTop();
    if (top > 400 && isDebateView) {
      this.setState({
        isNavbarHidden: true
      });
    } else {
      this.setState({
        isNavbarHidden: false
      });
    }
  }
  render() {
    const that = this;
    const children = React.Children.map(this.props.children, (child) => {
      return React.cloneElement(child, {
        identifier: that.state.identifier,
        isNavbarHidden: that.state.isNavbarHidden
      });
    });
    return (
      <div className="main">
        <Navbar isHidden={this.state.isNavbarHidden} location={this.state.location} />
        <div className="app-content">{children}</div>
        <Footer />
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
    fetchPosts: (discussionId) => {
      dispatch(fetchPosts(discussionId));
    },
    fetchUsers: (discussionId, connectedUserId) => {
      dispatch(fetchUsers(discussionId, connectedUserId));
    },
    fetchSynthesis: (discussionId) => {
      dispatch(fetchSynthesis(discussionId));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Main);