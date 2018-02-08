import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import ManageModules from '../components/administration/landingPage/manageModules';
import Navbar from '../components/administration/navbar';
import { displayAlert } from '../utils/utilityManager';
import SaveButton, { getMutationsPromises, runSerial } from '../components/administration/saveButton';
import landingPagePlugin from '../utils/administration/landingPage';

class LandingPageAdmin extends React.Component {
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
          refetchLandingPageModules();
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
        {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={1} phaseIdentifier="landingPage" />}
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
      return module.set('order', idx + 1).set('isNew', !module.get('existsInDatabase'));
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