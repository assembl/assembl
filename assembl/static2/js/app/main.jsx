// @flow

import React from 'react';
import { connect } from 'react-redux';

import { getCurrentPhaseIdentifier, type Timeline } from './utils/timeline';
import Navbar from './components/navbar/navbar';
import Footer from './components/common/footer';

type Debate = { debateData: { timeline: Timeline } };

class Main extends React.Component {
  state: { identifier: string, location: string };
  constructor(props: {
    debate: Debate,
    params: { phase: string },
    location: { query: { phase: string }, pathname: string },
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
    const children = React.Children.map(this.props.children, (child) => {
      return React.cloneElement(child, {
        identifier: that.state.identifier
      });
    });
    return (
      <div className="main">
        <Navbar location={this.state.location} />
        <div className="app-content">{children}</div>
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

export default connect(mapStateToProps)(Main);