import React from 'react';
import { connect } from 'react-redux';
import { getCurrentPhaseIdentifier } from './utils/timeline';
import { addRedirectionToV1 } from './actions/phaseActions';
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
  }
  componentWillMount() {
    const { debateData } = this.props.debate;
    const currentPhaseIdentifier = getCurrentPhaseIdentifier(debateData.timeline);
    let isRedirectionToV1;
    if (debateData.timeline === null) {
      // timeline is not configured
      isRedirectionToV1 = true;
    } else {
      const currentPhase = debateData.timeline.filter((phase) => {
        return phase.identifier === currentPhaseIdentifier;
      });
      isRedirectionToV1 = currentPhase[0].interface_v1;
    }
    this.props.addRedirectionToV1(isRedirectionToV1);
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
      location: location
    });

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }
  componentWillUnmount() {
    window.removeEventListener('scroll', this.displayHeader);
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
        <Navbar location={this.state.location} />
        <div className="app-content">
          {children}
        </div>
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
    addRedirectionToV1: (discussionId) => {
      dispatch(addRedirectionToV1(discussionId));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Main);