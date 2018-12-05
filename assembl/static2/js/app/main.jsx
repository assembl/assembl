// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose, graphql } from "react-apollo";

import { getCurrentPhaseData, getPhaseId } from "./utils/timeline";
import Navbar from "./components/navbar/navbar";
import Footer from "./components/common/footer";
import CookiesBar from "./components/cookiesBar";
import AcceptcookiesModal from "./components/cookies/acceptCookiesModal";
import manageErrorAndLoading from "./components/common/manageErrorAndLoading";
import { fromGlobalId, getRouteLastString } from "./utils/globalFunctions";

type LegalContentsArray = Array<string>;

type Props = {
  timeline: Timeline,
  params: { phase?: string, phaseId?: string, themeId?: string },
  location: { pathname: string },
  id: string,
  children: React.Node,
  hasLegalNotice: boolean,
  hasTermsAndConditions: boolean,
  hasCookiesPolicy: boolean,
  hasPrivacyPolicy: boolean,
  hasUserGuidelines: boolean,
  acceptedLegalContentList: LegalContentsArray,
  updateAcceptedCookies: Function
};

class Main extends React.Component<Props> {
  render() {
    const {
      params,
      timeline,
      location
    } = this.props;
    const { themeId } = params;
    const { currentPhaseIdentifier, currentPhaseId } = getCurrentPhaseData(
      timeline
    );
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
        <AcceptcookiesModal location={location.pathname} />
        <CookiesBar />
        <Footer />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  timeline: state.timeline,
  lang: state.i18n.locale
});

export default connect(mapStateToProps)(Main);