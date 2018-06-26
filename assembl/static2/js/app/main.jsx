// @flow

import * as React from 'react';
import { connect } from 'react-redux';

import { getCurrentPhaseIdentifier } from './utils/timeline';
import Navbar from './components/navbar/navbar';
import Footer from './components/common/footer';
import CookiesBar from './components/cookiesBar';

type Props = {
  timeline: Timeline,
  params: { phase: string, themeId: ?string },
  location: { query: { phase: string }, pathname: string },
  children: React.Node
};

type State = { identifier: string, location: string };

class Main extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { timeline } = this.props;
    const paramsIdentifier = this.props.params.phase || getCurrentPhaseIdentifier(timeline);
    const queryIdentifier = this.props.location.query.phase || paramsIdentifier;
    this.state = {
      identifier: queryIdentifier,
      location: this.props.location.pathname
    };
  }

  componentWillReceiveProps(nextProps) {
    const location = nextProps.location.pathname;
    const { timeline } = this.props;
    const paramsIdentifier = nextProps.params.phase || getCurrentPhaseIdentifier(timeline);
    const queryIdentifier = nextProps.location.query.phase || paramsIdentifier;
    this.setState({
      identifier: queryIdentifier,
      location: location
    });

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }

  render() {
    const { themeId } = this.props.params;
    const that = this;
    const children = React.Children.map(this.props.children, child =>
      React.cloneElement(child, {
        identifier: that.state.identifier
      })
    );
    return (
      <div className="main">
        <Navbar location={this.state.location} themeId={themeId} />
        <div className="app-content">{children}</div>
        <CookiesBar />
        <Footer />
      </div>
    );
  }
}

const mapStateToProps = (state: { timeline: Timeline }) => ({
  timeline: state.timeline
});

export default connect(mapStateToProps)(Main);