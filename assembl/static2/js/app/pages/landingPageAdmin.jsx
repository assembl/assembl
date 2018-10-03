// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { type Route, type Router } from 'react-router';
import { I18n } from 'react-redux-i18n';
import { EditorState } from 'draft-js';
import { List, Map } from 'immutable';
import moment from 'moment';

import { convertEntriesToHTML, convertImmutableEntriesToJS } from '../utils/draftjs';
import { getEntryValueForLocale } from '../utils/i18n';
import ManageModules from '../components/administration/landingPage/manageModules';
import CustomizeHeader from '../components/administration/landingPage/customizeHeader';
import ManageTimeline from '../components/administration/landingPage/manageTimeline';
import Navbar from '../components/administration/navbar';
import { displayAlert } from '../utils/utilityManager';
import SaveButton, { getMutationsPromises, runSerial } from '../components/administration/saveButton';
import landingPageModulesPlugin from '../utils/administration/landingPageModules';
import updateDiscussionMutation from '../graphql/mutations/updateDiscussion.graphql';
import updateDiscussionPhaseMutation from '../graphql/mutations/updateDiscussionPhase.graphql';

type Props = {
  landingPageModules: Array<Object>,
  landingPageModulesHasChanged: boolean,
  refetchLandingPageModules: Function,
  refetchLandingPage: Function,
  route: Route,
  router: Router,
  section: string,
  editLocale: string,
  header: {
    title: string,
    subtitle: EditorState,
    buttonLabel: string,
    headerImgMimeType: string,
    headerImgUrl: string,
    headerImgTitle: string,
    logoImgMimeType: string,
    logoImgUrl: string,
    logoImgTitle: string
  },
  pageHasChanged: boolean,
  phasesHaveChanged: boolean,
  page: Map<string, any>,
  updateDiscussion: Function,
  updateDiscussionPhase: Function,
  discussionPhases: Array<Object>,
  refetchTimeline: Function,
  timelineModuleId: string
};

type State = {
  refetching: boolean
};

class LandingPageAdmin extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      refetching: false
    };
  }

  componentDidMount() {
    this.props.router.setRouteLeaveHook(this.props.route, this.routerWillLeave);
  }

  componentWillUnmount() {
    this.props.router.setRouteLeaveHook(this.props.route, null);
  }

  routerWillLeave = () => {
    if (this.dataHaveChanged() && !this.state.refetching) {
      return I18n.t('administration.confirmUnsavedChanges');
    }

    return null;
  };

  getImageVariable = (img) => {
    const externalUrl = img ? img.externalUrl : null;
    if (externalUrl === 'TO_DELETE') {
      return externalUrl;
    }
    return typeof externalUrl === 'object' ? externalUrl : null;
  };

  createVariablesForDiscussionPhaseMutation = phase => ({
    id: phase.id,
    identifier: phase.identifier,
    order: phase.order,
    isThematicsTable: phase.isThematicsTable,
    start: moment(phase.start, moment.ISO_8601),
    end: moment(phase.end, moment.ISO_8601),
    titleEntries: phase.titleEntries,
    descriptionEntries: phase.descriptionEntries,
    image: phase.image && typeof phase.image.externalUrl === 'object' ? phase.image.externalUrl : null
  });

  saveAction = () => {
    const {
      landingPageModulesHasChanged,
      landingPageModules,
      refetchLandingPageModules,
      refetchLandingPage,
      pageHasChanged,
      page,
      updateDiscussion,
      phasesHaveChanged,
      discussionPhases,
      editLocale,
      updateDiscussionPhase,
      refetchTimeline
    } = this.props;
    displayAlert('success', `${I18n.t('loading.wait')}...`);
    if (landingPageModulesHasChanged) {
      const mutationsPromises = getMutationsPromises({
        items: landingPageModules,
        variablesCreator: landingPageModulesPlugin.variablesCreator,
        createMutation: this.props[landingPageModulesPlugin.createMutationName],
        updateMutation: this.props[landingPageModulesPlugin.updateMutationName]
      });

      runSerial(mutationsPromises)
        .then(() => {
          refetchLandingPageModules().then(() => this.setState({ refetching: false }));
          displayAlert('success', I18n.t('administration.landingPage.successSave'));
        })
        .catch((error) => {
          displayAlert('danger', error, false, 30000);
        });
    }

    if (pageHasChanged) {
      // $FlowFixMe flow doesn't seem to know the second param of Map.get()
      const subtitleEntries = convertImmutableEntriesToJS(page.get('subtitleEntries', List()));
      updateDiscussion({
        variables: {
          // $FlowFixMe flow doesn't seem to know the second param of Map.get()
          titleEntries: page.get('titleEntries', List()).toJS(),
          subtitleEntries: convertEntriesToHTML(subtitleEntries),
          // $FlowFixMe flow doesn't seem to know the second param of Map.get()
          buttonLabelEntries: page.get('buttonLabelEntries', List()).toJS(),
          // $FlowFixMe flow doesn't seem to know the second param of Map.get()
          headerImage: this.getImageVariable(page.get('headerImage', Map()).toJS()),
          // $FlowFixMe flow doesn't seem to know the second param of Map.get()
          logoImage: this.getImageVariable(page.get('logoImage', Map()).toJS())
        }
      })
        .then(() => {
          refetchLandingPage().then(() => this.setState({ refetching: false }));
          displayAlert('success', I18n.t('administration.landingPage.headerSuccessSave'));
        })
        .catch((error) => {
          displayAlert('danger', error.message);
        });
    }

    if (phasesHaveChanged) {
      const mutationPromises = getMutationsPromises({
        items: discussionPhases,
        variablesCreator: this.createVariablesForDiscussionPhaseMutation,
        updateMutation: updateDiscussionPhase,
        lang: editLocale
      });

      runSerial(mutationPromises)
        .then(() => {
          this.setState({ refetching: true }, () => {
            refetchTimeline().then(() => {
              displayAlert('success', I18n.t('administration.timelineAdmin.successSave'));
              this.setState({ refetching: false });
            });
          });
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }
  };

  dataHaveChanged = (): boolean =>
    this.props.landingPageModulesHasChanged || this.props.pageHasChanged || this.props.phasesHaveChanged;

  render() {
    const { editLocale, header, section, timelineModuleId } = this.props;
    const saveDisabled = !this.dataHaveChanged();
    return (
      <div className="landing-page-admin">
        <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />
        {section === '1' && <ManageModules {...this.props} />}
        {section === '2' && <CustomizeHeader editLocale={editLocale} header={header} />}
        {section === '3' && <ManageTimeline timelineModuleId={timelineModuleId} editLocale={editLocale} />}
        {section && <Navbar currentStep={section} steps={['1', '2', '3']} phaseIdentifier="landingPage" />}
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { editLocale, landingPage, timeline } }) => {
  const { page } = landingPage;
  const subtitle = getEntryValueForLocale(page.get('subtitleEntries'), editLocale, EditorState.createEmpty());
  const timelineModule = landingPage.modulesById.find(module => module.getIn(['moduleType', 'identifier']) === 'TIMELINE');
  // timelineModule can be undefined when modulesById is not loaded yet
  const timelineModuleId = timelineModule ? timelineModule.get('id') : null;
  return {
    landingPageModulesHasChanged: landingPage.modulesHasChanged,
    landingPageModules: landingPage.modulesById
      .map((module) => {
        const id = module.get('id');
        const idx = landingPage.enabledModulesInOrder.indexOf(id);
        return module
          .set('order', idx + 1)
          .set('_hasChanged', true)
          .set('_isNew', !module.get('existsInDatabase'));
      })
      .valueSeq()
      .toJS(),
    timelineModuleId: timelineModuleId,
    header: {
      title: getEntryValueForLocale(page.get('titleEntries'), editLocale, ''),
      subtitle: subtitle,
      buttonLabel: getEntryValueForLocale(page.get('buttonLabelEntries'), editLocale, ''),
      headerImgMimeType: page.getIn(['headerImage', 'mimeType']),
      headerImgUrl: page.getIn(['headerImage', 'externalUrl']),
      headerImgTitle: page.getIn(['headerImage', 'title']),
      logoImgMimeType: page.getIn(['logoImage', 'mimeType']),
      logoImgUrl: page.getIn(['logoImage', 'externalUrl']),
      logoImgTitle: page.getIn(['logoImage', 'title'])
    },
    page: landingPage.page,
    pageHasChanged: landingPage.pageHasChanged,
    editLocale: editLocale,
    phasesHaveChanged: timeline.phasesHaveChanged,
    discussionPhases: timeline.phasesById
      .sortBy(phase => phase.get('order'))
      .valueSeq()
      .toJS()
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(landingPageModulesPlugin.createMutation, {
    name: landingPageModulesPlugin.createMutationName
  }),
  graphql(landingPageModulesPlugin.updateMutation, {
    name: landingPageModulesPlugin.updateMutationName
  }),
  graphql(updateDiscussionMutation, {
    name: 'updateDiscussion'
  }),
  graphql(updateDiscussionPhaseMutation, {
    name: 'updateDiscussionPhase'
  })
)(LandingPageAdmin);