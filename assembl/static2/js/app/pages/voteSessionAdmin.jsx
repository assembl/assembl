// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { I18n, Translate } from 'react-redux-i18n';
import type { List, Map } from 'immutable';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router';

import PageForm from '../components/administration/voteSession/pageForm';
import ModulesSection from '../components/administration/voteSession/modulesSection';
import VoteProposalsSection from '../components/administration/voteSession/voteProposalsSection';
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
import createProposalMutation from '../graphql/mutations/createProposal.graphql';
import updateProposalMutation from '../graphql/mutations/updateProposal.graphql';
import deleteProposalMutation from '../graphql/mutations/deleteProposal.graphql';
import { convertEntriesToHTML } from '../utils/draftjs';
import { getPhaseId } from '../utils/timeline';
import { get } from '../utils/routeMap';
import { displayAlert, displayCustomModal, closeModal } from '../utils/utilityManager';
import { getDiscussionSlug } from '../utils/globalFunctions';

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
    id: t.id,
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

const createVariablesForProposalsMutation = proposals => ({
  voteSessionId: proposals.voteSessionId,
  titleEntries: proposals.titleEntries,
  descriptionEntries: proposals.descriptionEntries
});

class VoteSessionAdmin extends React.Component<void, VoteSessionAdminProps, void> {
  componentWillReceiveProps(nextProps) {
    const { section, voteSessionPage } = nextProps;
    const currentStep = parseInt(section, 10);
    const slug = { slug: getDiscussionSlug() };
    if ((currentStep === 2 || currentStep === 3) && !voteSessionPage.get('id')) {
      setTimeout(() => {
        const content = (
          <div className="modal-body">
            <p>
              <Translate value="administration.configureVoteSession" />
            </p>
            <p>
              <Translate value="administration.saveFirstStep" />
            </p>
            <Link to={`${get('administration', slug)}/voteSession?section=1`}>
              <Button key="cancel" onClick={closeModal} className="button-cancel button-dark button-modal">
                <Translate value="administration.backToStep1" />
              </Button>
            </Link>
          </div>
        );

        displayCustomModal(content, true, 'modal-centered');
      }, 500);
    }
  }

  runMutations(mutationsPromises) {
    const { refetchVoteSession } = this.props;
    runSerial(mutationsPromises).then(() => {
      refetchVoteSession();
      displayAlert('success', I18n.t('administration.voteSessionSuccess'));
    });
  }

  saveAction = () => {
    const {
      i18n,
      tokenModulesHaveChanged,
      numberGaugeModulesHaveChanged,
      textGaugeModulesHaveChanged,
      voteProposalsHaveChanged,
      refetchVoteSession,
      timeline,
      voteModules,
      voteSessionPage,
      voteProposals,
      createTokenVoteSpecification,
      createGaugeVoteSpecification,
      updateGaugeVoteSpecification,
      createNumberGaugeVoteSpecification,
      updateNumberGaugeVoteSpecification,
      deleteVoteSpecification,
      updateTokenVoteSpecification,
      updateVoteSession,
      createProposal,
      updateProposal,
      deleteProposal
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

        this.runMutations(mutationsPromises);
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

        this.runMutations(mutationsPromises);
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

        this.runMutations(mutationsPromises);
      }
      if (voteProposalsHaveChanged) {
        const items = [];
        voteProposals.forEach((t) => {
          items.push({ ...t.toJS(), voteSessionId: voteSessionPage.get('id') });
        });
        const mutationsPromises = getMutationsPromises({
          items: items,
          variablesCreator: createVariablesForProposalsMutation,
          deleteVariablesCreator: createVariablesForDeleteMutation,
          createMutation: createProposal,
          updateMutation: updateProposal,
          deleteMutation: deleteProposal,
          lang: i18n.locale
        });

        this.runMutations(mutationsPromises);
      }
    }
  };

  render() {
    const {
      editLocale,
      tokenModulesHaveChanged,
      textGaugeModulesHaveChanged,
      numberGaugeModulesHaveChanged,
      voteProposalsHaveChanged,
      section,
      voteSessionPage
    } = this.props;
    const saveDisabled =
      !tokenModulesHaveChanged &&
      !textGaugeModulesHaveChanged &&
      !numberGaugeModulesHaveChanged &&
      !voteProposalsHaveChanged &&
      !voteSessionPage.get('hasChanged');
    const currentStep = parseInt(section, 10);
    return (
      <div className="token-vote-admin">
        <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />
        {section === '1' && <PageForm editLocale={editLocale} />}
        {section === '2' && <ModulesSection />}
        {section === '3' && <VoteProposalsSection />}
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
    numberGaugeModulesHaveChanged,
    voteProposalsHaveChanged,
    voteProposalsInOrder,
    voteProposalsById
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
    voteProposalsHaveChanged: voteProposalsHaveChanged,
    timeline: debate.debateData.timeline,
    voteModules: modules,
    voteSessionPage: voteSession.page,
    voteProposals: voteProposalsInOrder.map(id => voteProposalsById.get(id))
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
  }),
  graphql(createProposalMutation, {
    name: 'createProposal'
  }),
  graphql(updateProposalMutation, {
    name: 'updateProposal'
  }),
  graphql(deleteProposalMutation, {
    name: 'deleteProposal'
  })
)(VoteSessionAdmin);