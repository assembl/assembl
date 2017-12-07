// @flow

import React from 'react';
import { connect } from 'react-redux';

import { getCurrentPhaseIdentifier, type Timeline } from './utils/timeline';
import { addRedirectionToV1 } from './actions/phaseActions';
import Navbar from './components/navbar/navbar';
import Footer from './components/common/footer';

type Debate = { debateData: { timeline: Timeline } };

class Main extends React.Component {
  state: { identifier: string, location: string };

  constructor(props: {
    debate: Debate,
    params: { phase: string },
    location: { query: { phase: string }, pathname: string },
    addRedirectionToV1: boolean => {},
    children: React.Children
  }) {
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
      const currentPhase = debateData.timeline.filter(phase => phase.identifier === currentPhaseIdentifier);
      isRedirectionToV1 = currentPhase[0] && currentPhase[0].interface_v1;
    }
    this.props.addRedirectionToV1(isRedirectionToV1);
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

  render() {
    const that = this;
    const children = React.Children.map(this.props.children, child =>
      React.cloneElement(child, {
        identifier: that.state.identifier
      })
    );
    return (
      <div className="main">
        <Navbar location={this.state.location} />
        <div className="app-content">{children}</div>
        <Footer />
      </div>
    );
  }
}

const mapStateToProps = (state: { debate: Debate }) => ({
  debate: state.debate
});

const mapDispatchToProps = dispatch => ({
  addRedirectionToV1: (discussionId: string) => {
    dispatch(addRedirectionToV1(discussionId));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(Main);