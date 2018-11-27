// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';

import { getCurrentPhaseData, getPhaseId } from './utils/timeline';
import Navbar from './components/navbar/navbar';
import Footer from './components/common/footer';
import CookiesBar from './components/cookiesBar';
import manageErrorAndLoading from './components/common/manageErrorAndLoading';
import { fromGlobalId, getRouteLastString } from './utils/globalFunctions';
import { legalConfirmModal } from './utils/utilityManager';
import { legalContentSlugs } from './constants';
import TabsConditionQuery from './graphql/TabsConditionQuery.graphql';

type Props = {
  timeline: Timeline,
  params: { phase?: string, phaseId?: string, themeId?: string },
  location: { pathname: string },
  children: React.Node,
  hasLegalNotice: boolean,
  hasTermsAndConditions: boolean,
  hasCookiesPolicy: boolean,
  hasPrivacyPolicy: boolean,
  hasUserGuidelines: boolean
};

class Main extends React.Component<Props> {
  componentDidUpdate() {
    const lastRouteString = getRouteLastString(this.props.location.pathname);
    const isOnLegalContentPage = legalContentSlugs.includes(lastRouteString);
    if (!isOnLegalContentPage) {
      legalConfirmModal();
    }
  }

  render() {
    const {
      params,
      timeline,
      location,
      hasLegalNotice,
      hasTermsAndConditions,
      hasCookiesPolicy,
      hasPrivacyPolicy,
      hasUserGuidelines
    } = this.props;
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
        <CookiesBar />
        <Footer
          hasLegalNotice={hasLegalNotice}
          hasTermsAndConditions={hasTermsAndConditions}
          hasCookiesPolicy={hasCookiesPolicy}
          hasPrivacyPolicy={hasPrivacyPolicy}
          hasUserGuidelines={hasUserGuidelines}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  timeline: state.timeline,
  lang: state.i18n.locale
});

const withData = graphql(TabsConditionQuery, {
  props: ({ data: { hasLegalNotice, hasTermsAndConditions, hasCookiesPolicy, hasPrivacyPolicy, hasUserGuidelines } }) => ({
    hasLegalNotice: hasLegalNotice,
    hasTermsAndConditions: hasTermsAndConditions,
    hasCookiesPolicy: hasCookiesPolicy,
    hasPrivacyPolicy: hasPrivacyPolicy,
    hasUserGuidelines: hasUserGuidelines
  })
});
export default compose(connect(mapStateToProps), withData, manageErrorAndLoading({ displayLoader: false }))(Main);