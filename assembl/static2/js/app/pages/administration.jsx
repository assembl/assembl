// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { filter } from 'graphql-anywhere';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';

import { displayLanguageMenu } from '../actions/adminActions';
import { updateVoteSessionPage, updateVoteModules, updateVoteProposals } from '../actions/adminActions/voteSession';
import { updateSections } from '../actions/adminActions/adminSections';
import { updateLandingPageModules } from '../actions/adminActions/landingPage';
import { updateTextFields } from '../actions/adminActions/profileOptions';
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
import mergeLoadingAndError from '../components/common/mergeLoadingAndError';
import Menu from '../components/administration/menu';
import LanguageMenu from '../components/administration/languageMenu';
import SectionsQuery from '../graphql/SectionsQuery.graphql';
import TextFields from '../graphql/TextFields.graphql';
import VoteSessionQuery from '../graphql/VoteSession.graphql';
import LandingPageModulesQuery from '../graphql/LandingPageModulesQuery.graphql';
import { convertEntriesToEditorState } from '../utils/draftjs';
import { getPhaseId } from '../utils/timeline';
import { fromGlobalId } from '../utils/globalFunctions';
import { addEnumSuffixToModuleTitles } from '../components/administration/landingPage/addEnumSuffixToModuleTitles';

import { SECTION_PERSONALIZE_INTERFACE, SECTION_DISCUSSION_PREFERENCES, SECTION_PROFILE_OPTIONS } from './../constants';

const SECTIONS_WITHOUT_LANGUAGEMENU = [SECTION_PERSONALIZE_INTERFACE, SECTION_DISCUSSION_PREFERENCES];

type Props = {
  sections: Array<Object>,
  voteSession: Object,
  textFields: Array<Object>,
  landingPageModules: Array<Object>,
  children: React.Node,
  locale: string,
  location: { query: { section?: string, thematicId?: string, goBackPhaseIdentifier?: string } },
  params: { phase: string },
  refetchTabsConditions: Function,
  refetchSections: Function,
  refetchVoteSession: Function,
  refetchLandingPageModules: Function,
  refetchTextFields: Function,
  refetchTimeline: Function,
  updateSections: Function,
  updateVoteModules: Function,
  updateVoteSessionPage: Function,
  updateVoteProposals: Function,
  displayLanguageMenu: (isHidden: boolean) => void,
  updateLandingPageModules: Function,
  updateTextFields: Function,
  timeline: Timeline,
  identifier: string
};

type State = {
  showLanguageMenu: boolean
};

class Administration extends React.Component<Props, State> {
  state = {
    showLanguageMenu: true
  };

  componentDidMount() {
    // we need to use the redux store for administration data to be able to use a
    // "global" save button that will do all the mutations "at once"
    const { sections, voteSession, identifier, location, landingPageModules, textFields } = this.props;
    this.putSectionsInStore(sections);
    this.putVoteSessionInStore(voteSession);
    this.putVoteModulesInStore(voteSession);
    this.putVoteProposalsInStore(voteSession);
    const isHidden =
      (identifier === 'discussion' && SECTIONS_WITHOUT_LANGUAGEMENU.includes(location.query.section)) ||
      identifier === 'exportDebateData';
    this.props.displayLanguageMenu(isHidden);
    this.putLandingPageModulesInStore(landingPageModules);
    this.putTextFieldsInStore(textFields);
  }

  componentWillReceiveProps(nextProps) {
    const { sections, voteSession, identifier, location, landingPageModules, textFields } = nextProps;
    if (sections !== this.props.sections) {
      this.putSectionsInStore(sections);
    }

    if (voteSession !== this.props.voteSession) {
      this.putVoteSessionInStore(voteSession);
      this.putVoteModulesInStore(voteSession);
      this.putVoteProposalsInStore(voteSession);
    }

    if (landingPageModules !== this.props.landingPageModules) {
      this.putLandingPageModulesInStore(landingPageModules);
    }

    const isHidden =
      (identifier === 'discussion' && SECTIONS_WITHOUT_LANGUAGEMENU.includes(location.query.section)) ||
      identifier === 'exportDebateData';
    this.props.displayLanguageMenu(isHidden);

    if (textFields !== this.props.textFields) {
      this.putTextFieldsInStore(textFields);
    }
  }

  putVoteSessionInStore = (voteSession) => {
    const emptyVoteSession = {
      id: '',
      seeCurrentVotes: false,
      propositionsSectionTitleEntries: [],
      modules: []
    };
    const filteredVoteSession = filter(VoteSessionQuery, { voteSession: voteSession || emptyVoteSession });
    this.props.updateVoteSessionPage(filteredVoteSession.voteSession);
  };

  putVoteModulesInStore = (voteSession) => {
    const filteredVoteSession = filter(VoteSessionQuery, { voteSession: voteSession });
    const modules =
      filteredVoteSession.voteSession && filteredVoteSession.voteSession.modules ? filteredVoteSession.voteSession.modules : [];
    this.props.updateVoteModules(modules);
  };

  putVoteProposalsInStore = (voteSession) => {
    const proposals = voteSession ? filter(VoteSessionQuery, { voteSession: voteSession }).voteSession.proposals : [];
    const proposalsForStore = proposals.map(proposal => ({
      ...proposal,
      descriptionEntries: proposal.descriptionEntries ? convertEntriesToEditorState(proposal.descriptionEntries) : null
    }));
    this.props.updateVoteProposals(proposalsForStore);
  };

  putSectionsInStore = (sections) => {
    if (sections) {
      const filteredSections = filter(SectionsQuery, {
        sections: sections.filter(section => section.sectionType !== 'ADMINISTRATION')
      });
      this.props.updateSections(filteredSections.sections);
    }
  };

  putLandingPageModulesInStore = (landingPageModules) => {
    if (landingPageModules) {
      const filtered = filter(LandingPageModulesQuery, { landingPageModules: landingPageModules });
      const landingPageModulesWithUpdatedTitles = addEnumSuffixToModuleTitles(filtered.landingPageModules);
      this.props.updateLandingPageModules(landingPageModulesWithUpdatedTitles);
    }
  };

  putTextFieldsInStore(textFields) {
    if (textFields) {
      const filtered = filter(TextFields, { textFields: textFields });
      this.props.updateTextFields(filtered.textFields);
    }
  }

  render() {
    const {
      children,
      locale,
      location,
      params,
      refetchTabsConditions,
      refetchSections,
      refetchVoteSession,
      refetchLandingPageModules,
      refetchTextFields,
      refetchTimeline,
      timeline
    } = this.props;
    const { phase } = params;
    const phaseId = getPhaseId(timeline, phase);
    const discussionPhaseId = phaseId ? fromGlobalId(phaseId) : null;
    const childrenWithProps = React.Children.map(children, child =>
      React.cloneElement(child, {
        discussionPhaseId: discussionPhaseId,
        locale: locale,
        refetchTabsConditions: refetchTabsConditions,
        refetchVoteSession: refetchVoteSession,
        refetchSections: refetchSections,
        refetchLandingPageModules: refetchLandingPageModules,
        refetchTextFields: refetchTextFields,
        refetchTimeline: refetchTimeline
      })
    );
    return (
      <div className="administration">
        <div className="max-container">
          <Grid fluid>
            <Row className="margin-container">
              <Col xs={3} className="admin-menu-sticky">
                <div className="admin-menu-container">
                  <Menu
                    timeline={timeline}
                    locale={locale}
                    requestedPhase={phase}
                    thematicId={location.query.thematicId}
                    goBackPhaseIdentifier={location.query.goBackPhaseIdentifier}
                  />
                </div>
              </Col>
              <Col xs={8}>
                {!timeline ? (
                  <div>
                    <Translate value="administration.noTimeline" />
                  </div>
                ) : null}
                {childrenWithProps}
                <div className="save-bar">
                  <div className="max-container">
                    <Grid fluid>
                      <Row>
                        <Col xs={3} />
                        <Col xs={8}>
                          {/* save button is moved here via a ReactDOM portal */}
                          <div id="save-button" />
                        </Col>
                        <Col xs={1} />
                      </Row>
                    </Grid>
                  </div>
                </div>
              </Col>
              <Col xs={1}>
                <LanguageMenu />
              </Col>
            </Row>
          </Grid>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  timeline: state.timeline,
  locale: state.i18n.locale
});

const mapDispatchToProps = dispatch => ({
  updateSections: sections => dispatch(updateSections(sections)),
  updateVoteModules: voteModules => dispatch(updateVoteModules(voteModules)),
  updateVoteSessionPage: voteSession => dispatch(updateVoteSessionPage(voteSession)),
  updateVoteProposals: voteProposals => dispatch(updateVoteProposals(voteProposals)),
  displayLanguageMenu: isHidden => dispatch(displayLanguageMenu(isHidden)),
  updateLandingPageModules: landingPageModules => dispatch(updateLandingPageModules(landingPageModules)),
  updateTextFields: textFields => dispatch(updateTextFields(textFields))
});

const isNotInAdminSection = adminSectionName => props => !props.router.getCurrentLocation().pathname.endsWith(adminSectionName);

const isNotInDiscussionAdmin = isNotInAdminSection('discussion');
const isNotInLandingPageAdmin = isNotInAdminSection('landingPage');

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(VoteSessionQuery, {
    skip: ({ params }) => params.phase !== 'voteSession',
    options: ({ locale, location }) => ({
      variables: { ideaId: location.query.thematicId, lang: locale }
    }),
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          voteSessionMetadata: {
            error: data.error,
            loading: data.loading
          }
        };
      }

      return {
        voteSessionMetadata: {
          error: data.error,
          loading: data.loading
        },
        voteSession: data.voteSession,
        refetchVoteSession: data.refetch
      };
    }
  }),
  graphql(SectionsQuery, {
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          sectionsMetadata: {
            error: data.error,
            loading: data.loading
          }
        };
      }

      return {
        sectionsMetadata: {
          error: data.error,
          loading: data.loading
        },
        refetchSections: data.refetch,
        sections: data.sections
      };
    },
    skip: isNotInDiscussionAdmin
  }),
  graphql(LandingPageModulesQuery, {
    options: ({ locale }) => ({
      variables: { lang: locale }
    }),
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          landingPageModulesMetadata: {
            error: data.error,
            loading: data.loading
          },
          landingPageModules: []
        };
      }

      return {
        landingPageModulesMetadata: {
          error: data.error,
          loading: data.loading
        },
        refetchLandingPageModules: data.refetch,
        landingPageModules: data.landingPageModules
      };
    },
    skip: isNotInLandingPageAdmin
  }),
  graphql(TextFields, {
    options: ({ locale }) => ({
      variables: { lang: locale }
    }),
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          textFieldsMetadata: {
            error: data.error,
            loading: data.loading
          }
        };
      }

      return {
        textFieldsMetadata: {
          error: data.error,
          loading: data.loading
        },
        refetchTextFields: data.refetch,
        textFields: data.textFields
      };
    },
    skip: props =>
      isNotInDiscussionAdmin(props) || props.router.getCurrentLocation().search !== `?section=${SECTION_PROFILE_OPTIONS}`
  }),
  mergeLoadingAndError(['voteSessionMetadata', 'sectionsMetadata', 'landingPageModulesMetadata', 'textFieldsMetadata']),
  manageErrorAndLoading({ displayLoader: true })
)(Administration);