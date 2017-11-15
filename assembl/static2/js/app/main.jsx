// @flow

import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';

import { getCurrentPhaseIdentifier, type Timeline } from './utils/timeline';
import { addRedirectionToV1 } from './actions/phaseActions';
import Navbar from './components/common/navbar';
import Footer from './components/common/footer';
import HasSynthesesQuery from './graphql/HasSynthesesQuery.graphql';

type Debate = { debateData: { timeline: Timeline } };

class Main extends React.Component {
  state: { identifier: string, location: string };
  constructor(props: {
    debate: Debate,
    params: { phase: string },
    location: { query: { phase: string }, pathname: string },
    addRedirectionToV1: boolean => {},
    children: React.Children,
    hasSyntheses: boolean
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
      const currentPhase = debateData.timeline.filter((phase) => {
        return phase.identifier === currentPhaseIdentifier;
      });
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
    const { hasSyntheses } = this.props;
    const that = this;
    const children = React.Children.map(this.props.children, (child) => {
      return React.cloneElement(child, {
        identifier: that.state.identifier,
        hasSyntheses: hasSyntheses
      });
    });
    return (
      <div className="main">
        <Navbar location={this.state.location} hasSyntheses={hasSyntheses} />
        <div className="app-content">
          {children}
        </div>
        <Footer />
      </div>
    );
  }
}

const mapStateToProps = (state: { debate: Debate }) => {
  return {
    debate: state.debate
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addRedirectionToV1: (discussionId: string) => {
      dispatch(addRedirectionToV1(discussionId));
    }
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(HasSynthesesQuery, {
    props: ({ data }) => {
      return {
        hasSyntheses: data.hasSyntheses
      };
    }
  })
)(Main);