// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { type Route, type Router } from 'react-router';
import { I18n } from 'react-redux-i18n';

import ManageModules from '../../components/administration/landingPage/manageModules';
import { displayAlert } from '../../utils/utilityManager';
import { getMutationsPromises, runSerial } from '../../components/administration/saveButton';
import createLandingPageModule from '../../graphql/mutations/createLandingPageModule.graphql';
import updateLandingPageModule from '../../graphql/mutations/updateLandingPageModule.graphql';
import { resetLandingPageModules } from '../../actions/adminActions/landingPage';

type Props = {
  createLandingPageModule: Function,
  updateLandingPageModule: Function,
  isOrderingModules: boolean,
  landingPageModules: Array<Object>,
  refetchLandingPageModules: Function,
  resetLandingPageModulesAction: Function,
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

class Index extends React.Component<Props, State> {
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
    if (this.props.isOrderingModules && !this.state.refetching) {
      return I18n.t('administration.confirmUnsavedChanges');
    }

    return null;
  };

  createVariablesForLandingPageModuleMutation = item => ({
    configuration: '{}',
    enabled: item.enabled,
    order: item.order,
    typeIdentifier: item.moduleType.identifier,
    titleEntries: item.titleEntries,
    subtitleEntries: item.subtitleEntries
  });

  saveOrder = () => {
    const { landingPageModules, refetchLandingPageModules } = this.props;
    displayAlert('success', `${I18n.t('loading.wait')}...`, false, -1);
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
  };

  resetModules = () => {
    const { refetchLandingPageModules, resetLandingPageModulesAction } = this.props;
    refetchLandingPageModules().then((obj) => {
      resetLandingPageModulesAction(obj.data.landingPageModules);
      this.setState({ refetching: false });
    });
  };

  render() {
    return (
      <div className="landing-page-admin">
        <ManageModules {...this.props} saveOrder={this.saveOrder} resetOrder={this.resetModules} />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  resetLandingPageModulesAction: modules => dispatch(resetLandingPageModules(modules))
});

const mapStateToProps = ({ admin: { editLocale, landingPage } }) => ({
  isOrderingModules: landingPage.isOrderingModules,
  landingPageModules: landingPage.modulesById
    .map((module) => {
      const id = module.get('id');
      const idx = landingPage.modulesInOrder.indexOf(id);
      return module
        .set('order', idx + 1)
        .set('_hasChanged', true)
        .set('_isNew', !module.get('existsInDatabase'));
    })
    .valueSeq()
    .toJS(),
  editLocale: editLocale
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(createLandingPageModule, {
    name: 'createLandingPageModule'
  }),
  graphql(updateLandingPageModule, {
    name: 'updateLandingPageModule'
  })
)(Index);