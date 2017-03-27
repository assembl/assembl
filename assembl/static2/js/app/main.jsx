import React from 'react';
import { connect } from 'react-redux';
import { scrollToElement } from './utils/globalFunctions';
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
    this.displayHeader = this.displayHeader.bind(this);
  }
  componentWillMount() {
    const { debateId, connectedUserId } = this.props.context;
    this.props.fetchPosts(debateId);
    this.props.fetchSynthesis(debateId);
    this.props.fetchUsers(debateId, connectedUserId);
  }
  componentDidMount() {
    window.addEventListener('scroll', this.displayHeader);
  }
  componentWillReceiveProps(nextProps) {
    const { debateData } = this.props.debate;
    const paramsIdentifier = nextProps.params.phase || getCurrentPhaseIdentifier(debateData.timeline);
    const queryIdentifier = nextProps.location.query.phase || paramsIdentifier;
    this.state = {
      identifier: queryIdentifier,
      isNavbarHidden: false
    };
    scrollToElement(document.body, 0, 0);
  }
  componentWillUnmount() {
    window.removeEventListener('scroll', this.displayHeader);
  }
  displayHeader() {
    const isDebateView = this.props.location.pathname.indexOf('debate') > -1;
    const top = window.pageYOffset || document.documentElement.scrollTop;
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
        <Navbar isHidden={this.state.isNavbarHidden} />
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