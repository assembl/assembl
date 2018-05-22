// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { type Route, type Router } from 'react-router';
import { I18n } from 'react-redux-i18n';

import ManageModules from '../components/administration/landingPage/manageModules';
import CustomizeHeader from '../components/administration/landingPage/customizeHeader';
import Navbar from '../components/administration/navbar';
import { displayAlert } from '../utils/utilityManager';
import SaveButton, { getMutationsPromises, runSerial } from '../components/administration/saveButton';
import landingPagePlugin from '../utils/administration/landingPage';

type Props = {
  landingPageModules: Array<Object>,
  landingPageModulesHasChanged: boolean,
  refetchLandingPageModules: Function,
  route: Route,
  router: Router,
  section: string
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
    if (this.props.landingPageModulesHasChanged && !this.state.refetching) {
      return I18n.t('administration.confirmUnsavedChanges');
    }

    return null;
  };

  saveAction = () => {
    displayAlert('success', `${I18n.t('loading.wait')}...`);
    if (this.props.landingPageModulesHasChanged) {
      const { landingPageModules, refetchLandingPageModules } = this.props;
      const mutationsPromises = getMutationsPromises({
        items: landingPageModules,
        variablesCreator: landingPagePlugin.variablesCreator,
        createMutation: this.props[landingPagePlugin.createMutationName],
        updateMutation: this.props[landingPagePlugin.updateMutationName]
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
  };

  render() {
    const { landingPageModulesHasChanged, section } = this.props;
    const currentStep = parseInt(section, 10);
    const saveDisabled = !landingPageModulesHasChanged;
    return (
      <div className="landing-page-admin">
        <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />
        {section === '1' && <ManageModules {...this.props} />}
        {section === '2' && <CustomizeHeader {...this.props} />}
        {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={2} phaseIdentifier="landingPage" />}
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { landingPage } }) => ({
  landingPageModulesHasChanged: landingPage.modulesHasChanged,
  landingPageModules: landingPage.modulesByIdentifier
    .map((module) => {
      const identifier = module.getIn(['moduleType', 'identifier']);
      const idx = landingPage.enabledModulesInOrder.indexOf(identifier);
      return module.set('order', idx + 1).set('_isNew', !module.get('existsInDatabase'));
    })
    .valueSeq()
    .toJS()
});

export default compose(
  connect(mapStateToProps),
  graphql(landingPagePlugin.createMutation, {
    name: landingPagePlugin.createMutationName
  }),
  graphql(landingPagePlugin.updateMutation, {
    name: landingPagePlugin.updateMutationName
  })
)(LandingPageAdmin);