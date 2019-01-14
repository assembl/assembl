// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { type Route, type Router } from 'react-router';
import { I18n } from 'react-redux-i18n';
import moment from 'moment';

import ManageModules from '../components/administration/landingPage/manageModules';
import CustomizeHeader from '../components/administration/landingPage/header/index';
import ManageTimeline from '../components/administration/landingPage/manageTimeline';
import Navbar from '../components/administration/navbar';
import { displayAlert } from '../utils/utilityManager';
import SaveButton, { getMutationsPromises, runSerial } from '../components/administration/saveButton';
import updateDiscussionPhaseMutation from '../graphql/mutations/updateDiscussionPhase.graphql';
import createLandingPageModule from '../graphql/mutations/createLandingPageModule.graphql';
import updateLandingPageModule from '../graphql/mutations/updateLandingPageModule.graphql';

type Props = {
  createLandingPageModule: Function,
  updateLandingPageModule: Function,
  landingPageModules: Array<Object>,
  landingPageModulesHasChanged: boolean,
  refetchLandingPageModules: Function,
  route: Route,
  router: Router,
  section: string,
  editLocale: string,
  phasesHaveChanged: boolean,
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
    start: moment(phase.start, moment.ISO_8601),
    end: moment(phase.end, moment.ISO_8601),
    titleEntries: phase.titleEntries,
    descriptionEntries: phase.descriptionEntries,
    image: this.getImageVariable(phase.image)
  });

  createVariablesForLandingPageModuleMutation = item => ({
    configuration: '{}',
    enabled: item.enabled,
    order: item.order,
    typeIdentifier: item.moduleType.identifier,
    titleEntries: item.titleEntries,
    subtitleEntries: item.subtitleEntries
  });

  saveAction = () => {
    const {
      landingPageModulesHasChanged,
      landingPageModules,
      refetchLandingPageModules,
      phasesHaveChanged,
      discussionPhases,
      editLocale,
      updateDiscussionPhase,
      refetchTimeline
    } = this.props;
    displayAlert('success', `${I18n.t('loading.wait')}...`, false, -1);
    if (landingPageModulesHasChanged) {
      const mutationsPromises = getMutationsPromises({
        items: landingPageModules,
        variablesCreator: this.createVariablesForLandingPageModuleMutation,
        createMutation: this.props.createLandingPageModule,
        updateMutation: this.props.updateLandingPageModule
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

  dataHaveChanged = (): boolean => this.props.landingPageModulesHasChanged || this.props.phasesHaveChanged;

  render() {
    const { editLocale, section, timelineModuleId } = this.props;
    const saveDisabled = !this.dataHaveChanged();
    // TODO: Remove this crap after migrating all of landing page to react-final-form
    const showSaveButton = s => s !== '1';
    return (
      <div className="landing-page-admin">
        {showSaveButton(section) && <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />}
        {section === '1' && <CustomizeHeader editLocale={editLocale} />}
        {section === '2' && <ManageTimeline timelineModuleId={timelineModuleId} editLocale={editLocale} />}
        {section === '3' && <ManageModules {...this.props} />}
        {section && <Navbar currentStep={section} steps={['1', '2']} phaseIdentifier="landingPage" />}
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { editLocale, landingPage, timeline } }) => {
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
  graphql(createLandingPageModule, {
    name: 'createLandingPageModule'
  }),
  graphql(updateLandingPageModule, {
    name: 'updateLandingPageModule'
  }),
  graphql(updateDiscussionPhaseMutation, {
    name: 'updateDiscussionPhase'
  })
)(LandingPageAdmin);