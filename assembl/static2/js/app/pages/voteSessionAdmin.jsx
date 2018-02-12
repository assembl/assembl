// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { I18n } from 'react-redux-i18n';
import type { List, Map } from 'immutable';

import PageForm from '../components/administration/voteSession/pageForm';
import ModulesSection from '../components/administration/voteSession/modulesSection';
import PropositionSection from '../components/administration/voteSession/propositionSection';
import Navbar from '../components/administration/navbar';
import SaveButton, { getMutationsPromises, runSerial } from '../components/administration/saveButton';
import updateVoteSessionMutation from '../graphql/mutations/updateVoteSession.graphql';
import deleteVoteSpecificationMutation from '../graphql/mutations/deleteVoteSpecification.graphql';
import createTokenVoteSpecificationMutation from '../graphql/mutations/createTokenVoteSpecification.graphql';
import updateTokenVoteSpecificationMutation from '../graphql/mutations/updateTokenVoteSpecification.graphql';
import createGaugeVoteSpecificationMutation from '../graphql/mutations/createGaugeVoteSpecification.graphql';
import updateGaugeVoteSpecificationMutation from '../graphql/mutations/updateGaugeVoteSpecification.graphql';
import createNumberGaugeVoteSpecificationMutation from '../graphql/mutations/createNumberGaugeVoteSpecification.graphql';
import updateNumberGaugeVoteSpecificationMutation from '../graphql/mutations/updateNumberGaugeVoteSpecification.graphql';
import { convertEntriesToHTML } from '../utils/draftjs';
import { getPhaseId } from '../utils/timeline';
import { displayAlert } from '../utils/utilityManager';

type VoteSessionAdminProps = {
  editLocale: string,
  i18n: {
    locale: string
  },
  tokenModulesHaveChanged: boolean,
  textGaugeModulesHaveChanged: boolean,
  numberGaugeModulesHaveChanged: boolean,
  refetchVoteSession: Function,
  section: string,
  timeline: Timeline,
  voteModules: List,
  voteSessionPage: Map<string, *>,
  updateVoteSession: Function,
  deleteVoteSpecification: Function,
  createTokenVoteSpecification: Function,
  updateTokenVoteSpecification: Function,
  createGaugeVoteSpecification: Function,
  updateGaugeVoteSpecification: Function,
  createNumberGaugeVoteSpecification: Function,
  updateNumberGaugeVoteSpecification: Function
};

const createVariablesForDeleteMutation = voteModule => ({ id: voteModule.id });

const createVariablesForTokenVoteSpecificationMutation = voteModule => ({
  voteSessionId: voteModule.voteSessionId,
  exclusiveCategories: voteModule.exclusiveCategories,
  instructionsEntries: voteModule.instructionsEntries,
  titleEntries: [],
  tokenCategories: voteModule.tokenCategories.map(t => ({
    titleEntries: t.titleEntries,
    color: t.color,
    totalNumber: t.totalNumber
  }))
});

const createVariablesForTextGaugeMutation = voteModule => ({
  voteSessionId: voteModule.voteSessionId,
  titleEntries: [],
  instructionsEntries: voteModule.instructionsEntries,
  choices: voteModule.choices.map((c, index) => ({
    labelEntries: c.labelEntries,
    value: index.toFixed(2)
  }))
});

const createVariablesForNumberGaugeMutation = voteModule => ({
  voteSessionId: voteModule.voteSessionId,
  titleEntries: [],
  instructionsEntries: voteModule.instructionsEntries,
  nbTicks: voteModule.nbTicks,
  minimum: voteModule.minimum,
  maximum: voteModule.maximum,
  unit: voteModule.unit
});

class VoteSessionAdmin extends React.Component<void, VoteSessionAdminProps, void> {
  componentWillReceiveProps(nextProps) {
    const { section, voteSessionPage } = nextProps;
    const currentStep = parseInt(section, 10);
    if (currentStep === 2 && !voteSessionPage.get('id')) {
      setTimeout(() => {
        displayAlert('warning', I18n.t('administration.saveFirstStep'), false, 20000);
      }, 500);
    }
  }

  saveAction = () => {
    const {
      i18n,
      tokenModulesHaveChanged,
      numberGaugeModulesHaveChanged,
      textGaugeModulesHaveChanged,
      refetchVoteSession,
      timeline,
      voteModules,
      voteSessionPage,
      createTokenVoteSpecification,
      createGaugeVoteSpecification,
      updateGaugeVoteSpecification,
      createNumberGaugeVoteSpecification,
      updateNumberGaugeVoteSpecification,
      deleteVoteSpecification,
      updateTokenVoteSpecification,
      updateVoteSession
    } = this.props;

    if (voteSessionPage.get('hasChanged')) {
      const titleEntries = voteSessionPage.get('titleEntries').toJS();
      const subTitleEntries = voteSessionPage.get('subTitleEntries').toJS();
      const instructionsSectionTitleEntries = voteSessionPage.get('instructionsSectionTitleEntries').toJS();
      const instructionsSectionContentEntries = voteSessionPage.get('instructionsSectionContentEntries').toJS();
      const propositionsSectionTitleEntries = voteSessionPage.get('propositionsSectionTitleEntries').toJS();
      const pageHeaderImage = voteSessionPage.get('headerImage').toJS();
      const headerImage = typeof pageHeaderImage.externalUrl === 'object' ? pageHeaderImage.externalUrl : null;
      const payload = {
        variables: {
          discussionPhaseId: getPhaseId(timeline, 'voteSession'),
          titleEntries: titleEntries,
          subTitleEntries: subTitleEntries,
          instructionsSectionTitleEntries: instructionsSectionTitleEntries,
          instructionsSectionContentEntries: convertEntriesToHTML(instructionsSectionContentEntries),
          propositionsSectionTitleEntries: propositionsSectionTitleEntries,
          headerImage: headerImage
        }
      };
      updateVoteSession(payload)
        .then(() => {
          refetchVoteSession();
          displayAlert('success', I18n.t('administration.voteSessionSuccess'));
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }

    if (voteSessionPage.get('id')) {
      if (tokenModulesHaveChanged) {
        const tokenModules = voteModules.filter(m => m.get('type') === 'tokens');
        const items = [];
        tokenModules.forEach((t) => {
          items.push({ ...t.toJS(), voteSessionId: voteSessionPage.get('id') });
        });
        const mutationsPromises = getMutationsPromises({
          items: items,
          variablesCreator: createVariablesForTokenVoteSpecificationMutation,
          deleteVariablesCreator: createVariablesForDeleteMutation,
          createMutation: createTokenVoteSpecification,
          updateMutation: updateTokenVoteSpecification,
          deleteMutation: deleteVoteSpecification,
          lang: i18n.locale
        });

        runSerial(mutationsPromises).then(() => {
          refetchVoteSession();
          displayAlert('success', I18n.t('administration.voteSessionSuccess'));
        });
      }
      if (textGaugeModulesHaveChanged) {
        const textGaugeModules = voteModules.filter(m => m.get('type') === 'gauge' && !m.get('isNumberGauge'));
        const items = [];
        textGaugeModules.forEach((t) => {
          items.push({ ...t.toJS(), voteSessionId: voteSessionPage.get('id') });
        });
        const mutationsPromises = getMutationsPromises({
          items: items,
          variablesCreator: createVariablesForTextGaugeMutation,
          deleteVariablesCreator: createVariablesForDeleteMutation,
          createMutation: createGaugeVoteSpecification,
          updateMutation: updateGaugeVoteSpecification,
          deleteMutation: deleteVoteSpecification,
          lang: i18n.locale
        });

        runSerial(mutationsPromises).then(() => {
          refetchVoteSession();
          displayAlert('success', I18n.t('administration.voteSessionSuccess'));
        });
      }
      if (numberGaugeModulesHaveChanged) {
        const numberGaugeModules = voteModules.filter(m => m.get('type') === 'gauge' && m.get('isNumberGauge'));
        const items = [];
        numberGaugeModules.forEach((t) => {
          items.push({ ...t.toJS(), voteSessionId: voteSessionPage.get('id') });
        });
        const mutationsPromises = getMutationsPromises({
          items: items,
          variablesCreator: createVariablesForNumberGaugeMutation,
          deleteVariablesCreator: createVariablesForDeleteMutation,
          createMutation: createNumberGaugeVoteSpecification,
          updateMutation: updateNumberGaugeVoteSpecification,
          deleteMutation: deleteVoteSpecification,
          lang: i18n.locale
        });

        runSerial(mutationsPromises).then(() => {
          refetchVoteSession();
          displayAlert('success', I18n.t('administration.voteSessionSuccess'));
        });
      }
    } else {
      displayAlert('warning', I18n.t('administration.saveFirstStep'));
    }
  };

  render() {
    const {
      editLocale,
      tokenModulesHaveChanged,
      textGaugeModulesHaveChanged,
      numberGaugeModulesHaveChanged,
      section,
      voteSessionPage
    } = this.props;
    const saveDisabled =
      !tokenModulesHaveChanged &&
      !textGaugeModulesHaveChanged &&
      !numberGaugeModulesHaveChanged &&
      !voteSessionPage.get('hasChanged');
    const currentStep = parseInt(section, 10);
    return (
      <div className="token-vote-admin">
        <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />
        {section === '1' && <PageForm editLocale={editLocale} />}
        {section === '2' && <ModulesSection />}
        {section === '3' && <PropositionSection />}
        {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={3} phaseIdentifier="voteSession" />}
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { editLocale, voteSession }, debate, i18n }) => {
  const {
    modulesById,
    modulesInOrder,
    tokenCategoriesById,
    gaugeChoicesById,
    tokenModulesHaveChanged,
    textGaugeModulesHaveChanged,
    numberGaugeModulesHaveChanged
  } = voteSession;

  const modules = modulesInOrder.map((id) => {
    if (modulesById.getIn([id, 'choices'])) {
      return modulesById.get(id).set('choices', modulesById.getIn([id, 'choices']).map(t => gaugeChoicesById.get(t)));
    } else if (modulesById.getIn([id, 'tokenCategories'])) {
      return modulesById
        .get(id)
        .set('tokenCategories', modulesById.getIn([id, 'tokenCategories']).map(t => tokenCategoriesById.get(t)));
    }
    return modulesById.get(id);
  });
  return {
    editLocale: editLocale,
    i18n: i18n,
    tokenModulesHaveChanged: tokenModulesHaveChanged,
    textGaugeModulesHaveChanged: textGaugeModulesHaveChanged,
    numberGaugeModulesHaveChanged: numberGaugeModulesHaveChanged,
    timeline: debate.debateData.timeline,
    voteModules: modules,
    voteSessionPage: voteSession.page
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(updateVoteSessionMutation, {
    name: 'updateVoteSession'
  }),
  graphql(deleteVoteSpecificationMutation, {
    name: 'deleteVoteSpecification'
  }),
  graphql(createTokenVoteSpecificationMutation, {
    name: 'createTokenVoteSpecification'
  }),
  graphql(updateTokenVoteSpecificationMutation, {
    name: 'updateTokenVoteSpecification'
  }),
  graphql(createGaugeVoteSpecificationMutation, {
    name: 'createGaugeVoteSpecification'
  }),
  graphql(updateGaugeVoteSpecificationMutation, {
    name: 'updateGaugeVoteSpecification'
  }),
  graphql(createNumberGaugeVoteSpecificationMutation, {
    name: 'createNumberGaugeVoteSpecification'
  }),
  graphql(updateNumberGaugeVoteSpecificationMutation, {
    name: 'updateNumberGaugeVoteSpecification'
  })
)(VoteSessionAdmin);