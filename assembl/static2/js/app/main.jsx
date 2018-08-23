// @flow

import * as React from 'react';
import { connect } from 'react-redux';

import { getCurrentPhaseData } from './utils/timeline';
import Navbar from './components/navbar/navbar';
import Footer from './components/common/footer';
import CookiesBar from './components/cookiesBar';
import { fromGlobalId } from './utils/globalFunctions';

type Props = {
  timeline: Timeline,
  params: { phase: string, phaseId: string, themeId: ?string },
  location: { query: { phase: string, phaseId: string }, pathname: string },
  children: React.Node
};

type State = { identifier: string, phaseId: string, location: string };

class Main extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = this.getNewState(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getNewState(nextProps));
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }

  getNewState = (props: Props): State => {
    const { timeline } = this.props;
    const { location, params } = props;
    const { currentPhaseIdentifier, currentPhaseId } = getCurrentPhaseData(timeline);
    const paramsIdentifier = params.phase || currentPhaseIdentifier;
    const queryIdentifier = location.query.phase || paramsIdentifier;
    const paramsPhaseId = params.phaseId || currentPhaseId;
    const queryPhaseId = location.query.phaseId || paramsPhaseId;
    return {
      identifier: queryIdentifier,
      phaseId: queryPhaseId,
      location: location.pathname
    };
  };

  render() {
    const { themeId } = this.props.params;
    const { identifier, phaseId } = this.state;
    const discussionPhaseId = fromGlobalId(phaseId);
    const children = React.Children.map(this.props.children, child =>
      React.cloneElement(child, {
        identifier: identifier,
        discussionPhaseId: discussionPhaseId
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