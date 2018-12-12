// @flow
import * as React from 'react';
import { connect } from 'react-redux';

import { getCurrentPhaseData, getPhaseId } from './utils/timeline';
import Navbar from './components/navbar/navbar';
import Footer from './components/common/footer';
import CookiesBar from './components/cookiesBar';
import AcceptCookiesModal from './components/cookies/acceptCookiesModal';
import { fromGlobalId } from './utils/globalFunctions';

type Props = {
  timeline: Timeline,
  params: { phase?: string, phaseId?: string, themeId?: string },
  location: { pathname: string },
  children: React.Node
};

class Main extends React.Component<Props> {
  render() {
    const { params, timeline, location } = this.props;
    const { themeId } = params;
    const { currentPhaseIdentifier, currentPhaseId } = getCurrentPhaseData(timeline);
    let identifier = params.phase || null;
    let phaseId = currentPhaseId;
    if (!identifier) {
      identifier = currentPhaseIdentifier;
    } else {
      phaseId = getPhaseId(timeline, identifier);
    }
    const discussionPhaseId = phaseId ? fromGlobalId(phaseId) : null;
    const children = React.Children.map(this.props.children, child =>
      React.cloneElement(child, {
        identifier: identifier,
        phaseId: phaseId,
        discussionPhaseId: discussionPhaseId
      })
    );
    return (
      <div className="main">
        <Navbar location={location.pathname} themeId={themeId} />
        <div className="app-content">{children}</div>
        <AcceptCookiesModal pathname={location.pathname} />
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