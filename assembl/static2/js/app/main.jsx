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
import { legalContentSlugs, ESSENTIAL_SIGNUP_COOKIES as LEGAL_CONTENTS_TO_ACCEPT } from './constants';
import TabsConditionQuery from './graphql/TabsConditionQuery.graphql';
import updateAcceptedCookies from './graphql/mutations/updateAcceptedCookies.graphql';
import acceptedCookiesQuery from './graphql/acceptedCookiesQuery.graphql';

type Props = {
  timeline: Timeline,
  params: { phase?: string, phaseId?: string, themeId?: string },
  location: { pathname: string },
  children: React.Node,
  hasLegalNotice: boolean,
  hasTermsAndConditions: boolean,
  hasCookiesPolicy: boolean,
  hasPrivacyPolicy: boolean,
  hasUserGuidelines: boolean,
  updateAcceptedCookies: Function
};

class Main extends React.Component<Props> {
  componentDidUpdate() {
    const lastRouteString = getRouteLastString(this.props.location.pathname);
    const isOnLegalContentPage = legalContentSlugs.includes(lastRouteString);
    const { hasTermsAndConditions, hasPrivacyPolicy, hasUserGuidelines } = this.props;
    const legalContentsToAccept = {
      terms: hasTermsAndConditions,
      privacyPolicy: hasPrivacyPolicy,
      userGuidelines: hasUserGuidelines
    };
    const legalContentsArray = Object.keys(legalContentsToAccept).map(key => (legalContentsToAccept[key] ? key : null));
    const cleanLegalContentsArray = legalContentsArray.filter(el => el !== null);
    if (!isOnLegalContentPage) {
      legalConfirmModal(cleanLegalContentsArray, this.acceptAllLegalContents);
    }
  }

  getLegalContentsToAccept = () => {
    const { hasTermsAndConditions, hasPrivacyPolicy, hasUserGuidelines } = this.props;
    const legalContentsToAccept = {
      ACCEPT_CGU: hasTermsAndConditions,
      ACCEPT_PRIVACY_POLICY_ON_DISCUSSION: hasPrivacyPolicy,
      ACCEPT_USER_GUIDELINE_ON_DISCUSSION: hasUserGuidelines
    };
    const filteredLegalContentsToAccept = LEGAL_CONTENTS_TO_ACCEPT.filter(contentType => legalContentsToAccept[contentType]);
    return filteredLegalContentsToAccept;
  };

  acceptAllLegalContents = () => {
    const legalContentsToAccept = this.getLegalContentsToAccept();
    this.props.updateAcceptedCookies({ variables: { actions: legalContentsToAccept } });
  };

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
  lang: state.i18n.locale,
  id: state.context.connectedUserIdBase64
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

export default compose(
  connect(mapStateToProps),
  withData,
  graphql(updateAcceptedCookies, {
    name: 'updateAcceptedCookies'
  }),
  graphql(acceptedCookiesQuery, {
    skip: props => !props.id,
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        acceptedLegalContentList: data.user.acceptedCookies
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: false })
)(Main);