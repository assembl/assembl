// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { I18n, Translate } from 'react-redux-i18n';
import { List, type Map } from 'immutable';
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

type VoteModule = {
  choices?: Array<any>,
  exclusiveCategories?: boolean,
  id: string,
  instructionsEntries?: Array<string>,
  isNew: boolean,
  isNumberGauge?: boolean,
  isNumberGauge?: boolean,
  labelEntries: Array<string>,
  maximum?: number,
  minimum?: number,
  nbTicks?: number,
  proposalId?: ?string,
  toDelete: boolean,
  tokenCategories?: Array<Object>,
  type?: string,
  unit?: string,
  value: any,
  voteSpecTemplateId?: ?string,
  voteSessionId?: string,
  voteType?: string
};

const createVariablesForDeleteMutation = item => ({ id: item.id });

type CreateVariablesForTokenVoteSpecificationMutation = VoteModule => Object;
const createVariablesForTokenVoteSpecificationMutation: CreateVariablesForTokenVoteSpecificationMutation = voteModule => ({
  proposalId: voteModule.proposalId,
  voteSpecTemplateId: voteModule.voteSpecTemplateId,
  voteSessionId: voteModule.voteSessionId,
  exclusiveCategories: voteModule.exclusiveCategories,
  instructionsEntries: voteModule.instructionsEntries,
  titleEntries: [],
  tokenCategories: voteModule.tokenCategories
    ? voteModule.tokenCategories.map(t => ({
      id: t.id,
      titleEntries: t.titleEntries,
      color: t.color,
      totalNumber: t.totalNumber
    }))
    : []
});

type CreateVariablesForTextGaugeMutation = VoteModule => Object;
const createVariablesForTextGaugeMutation: CreateVariablesForTextGaugeMutation = voteModule => ({
  proposalId: voteModule.proposalId,
  voteSpecTemplateId: voteModule.voteSpecTemplateId,
  voteSessionId: voteModule.voteSessionId,
  titleEntries: [],
  instructionsEntries: voteModule.instructionsEntries,
  choices: voteModule.choices
    ? voteModule.choices.map((c, index) => ({
      labelEntries: c.labelEntries,
      value: index.toFixed(2)
    }))
    : []
});

type CreateVariablesForNumberGaugeMutation = VoteModule => Object;
const createVariablesForNumberGaugeMutation: CreateVariablesForNumberGaugeMutation = voteModule => ({
  proposalId: voteModule.proposalId,
  voteSpecTemplateId: voteModule.voteSpecTemplateId,
  voteSessionId: voteModule.voteSessionId,
  titleEntries: [],
  instructionsEntries: voteModule.instructionsEntries,
  nbTicks: voteModule.nbTicks,
  minimum: voteModule.minimum,
  maximum: voteModule.maximum,
  unit: voteModule.unit
});

const createVariablesForProposalsMutation = proposal => ({
  voteSessionId: proposal.voteSessionId,
  titleEntries: proposal.titleEntries,
  descriptionEntries: convertEntriesToHTML(proposal.descriptionEntries)
});

type VoteSessionAdminProps = {
  editLocale: string,
  i18n: {
    locale: string
  },
  tokenModulesHaveChanged: boolean,
  textGaugeModulesHaveChanged: boolean,
  numberGaugeModulesHaveChanged: boolean,
  voteProposalsHaveChanged: boolean,
  refetchVoteSession: Function,
  section: string,
  timeline: Timeline,
  voteProposals: List,
  voteModules: List,
  voteSessionPage: Map<string, *>,
  updateVoteSession: Function,
  deleteVoteSpecification: Function,
  createTokenVoteSpecification: Function,
  updateTokenVoteSpecification: Function,
  createGaugeVoteSpecification: Function,
  updateGaugeVoteSpecification: Function,
  createNumberGaugeVoteSpecification: Function,
  updateNumberGaugeVoteSpecification: Function,
  createProposal: Function,
  updateProposal: Function,
  deleteProposal: Function
};

type VoteSessionAdminState = {
  firstWarningDisplayed: boolean,
  secondWarningDisplayed: boolean
};

type TestModuleType = VoteModule => boolean;
const isTokenVoteModule: TestModuleType = m => m.voteType === 'token_vote_specification' || m.type === 'tokens';
const isTextGaugeModule: TestModuleType = m =>
  m.voteType === 'gauge_vote_specification' || (m.type === 'gauge' && !m.isNumberGauge);
const isNumberGaugeModule: TestModuleType = m =>
  m.voteType === 'number_gauge_vote_specification' || ((m.type === 'gauge' && m.isNumberGauge) || false);

class VoteSessionAdmin extends React.Component<void, VoteSessionAdminProps, VoteSessionAdminState> {
  props: VoteSessionAdminProps;

  state: VoteSessionAdminState;

  constructor(props: VoteSessionAdminProps) {
    super(props);
    this.state = {
      firstWarningDisplayed: false,
      secondWarningDisplayed: false
    };
  }

  componentWillReceiveProps(nextProps) {
    const { section, voteSessionPage, voteModules } = nextProps;
    const { firstWarningDisplayed, secondWarningDisplayed } = this.state;
    const currentStep = parseInt(section, 10);
    const slug = { slug: getDiscussionSlug() };
    const showModal = (message1, message2, buttonMessage, stepNumber) => {
      setTimeout(() => {
        const content = (
          <div className="modal-body">
            <p>
              <Translate value={message1} />
            </p>
            <p>
              <Translate value={message2} />
            </p>
            <Link to={`${get('administration', slug)}/voteSession?section=${stepNumber}`}>
              <Button key="cancel" onClick={closeModal} className="button-cancel button-dark button-modal">
                <Translate value={buttonMessage} number={stepNumber} />
              </Button>
            </Link>
          </div>
        );

        displayCustomModal(content, true, 'modal-centered');
      }, 500);
    };
    if ((currentStep === 2 || currentStep === 3) && !voteSessionPage.get('id') && !firstWarningDisplayed) {
      showModal('administration.configureVoteSession', 'administration.saveFirstStep', 'administration.backToPreviousStep', 1);
      this.setState({ firstWarningDisplayed: true });
    }
    if (currentStep === 3 && !voteSessionPage.get('id') && !secondWarningDisplayed) {
      showModal('administration.configureVoteSession', 'administration.saveFirstStep', 'administration.backToPreviousStep', 1);
      this.setState({ secondWarningDisplayed: true });
    } else if (currentStep === 3 && voteModules.size < 1 && !secondWarningDisplayed) {
      showModal('administration.configureVoteModules', 'administration.saveSecondStep', 'administration.backToPreviousStep', 2);
      this.setState({ secondWarningDisplayed: true });
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

    const getTokenVoteSpecMutationsPromises = items =>
      getMutationsPromises({
        items: items,
        variablesCreator: createVariablesForTokenVoteSpecificationMutation,
        deleteVariablesCreator: createVariablesForDeleteMutation,
        createMutation: createTokenVoteSpecification,
        updateMutation: updateTokenVoteSpecification,
        deleteMutation: deleteVoteSpecification,
        lang: i18n.locale
      });

    const getTextGaugeSpecMutationsPromises = items =>
      getMutationsPromises({
        items: items,
        variablesCreator: createVariablesForTextGaugeMutation,
        deleteVariablesCreator: createVariablesForDeleteMutation,
        createMutation: createGaugeVoteSpecification,
        updateMutation: updateGaugeVoteSpecification,
        deleteMutation: deleteVoteSpecification,
        lang: i18n.locale
      });

    const getNumberGaugeMutationsPromises = items =>
      getMutationsPromises({
        items: items,
        variablesCreator: createVariablesForNumberGaugeMutation,
        deleteVariablesCreator: createVariablesForDeleteMutation,
        createMutation: createNumberGaugeVoteSpecification,
        updateMutation: updateNumberGaugeVoteSpecification,
        deleteMutation: deleteVoteSpecification,
        lang: i18n.locale
      });

    const getMutationsForModules = (modules) => {
      const tokenVoteModules = modules.filter(isTokenVoteModule);
      const textGaugeModules = modules.filter(isTextGaugeModule);
      const numberGaugeModules = modules.filter(isNumberGaugeModule);
      return getTokenVoteSpecMutationsPromises(tokenVoteModules)
        .concat(getTextGaugeSpecMutationsPromises(textGaugeModules))
        .concat(getNumberGaugeMutationsPromises(numberGaugeModules));
    };

    if (voteSessionPage.get('id')) {
      let allSpecsMutationsPromises = [];
      if (tokenModulesHaveChanged) {
        const tokenModules = voteModules.filter(m => m.get('type') === 'tokens');
        const items = tokenModules.map(t => ({ ...t.toJS(), voteSessionId: voteSessionPage.get('id') }));
        const mutationsPromises = getTokenVoteSpecMutationsPromises(items);
        allSpecsMutationsPromises = allSpecsMutationsPromises.concat(mutationsPromises);
      }
      if (textGaugeModulesHaveChanged) {
        const textGaugeModules = voteModules.filter(m => m.get('type') === 'gauge' && !m.get('isNumberGauge'));
        const items = textGaugeModules.map(t => ({ ...t.toJS(), voteSessionId: voteSessionPage.get('id') }));
        const mutationsPromises = getTextGaugeSpecMutationsPromises(items);
        allSpecsMutationsPromises = allSpecsMutationsPromises.concat(mutationsPromises);
      }
      if (numberGaugeModulesHaveChanged) {
        const numberGaugeModules = voteModules.filter(m => m.get('type') === 'gauge' && m.get('isNumberGauge'));
        const items = numberGaugeModules.map(t => ({ ...t.toJS(), voteSessionId: voteSessionPage.get('id') }));
        const mutationsPromises = getNumberGaugeMutationsPromises(items);
        allSpecsMutationsPromises = allSpecsMutationsPromises.concat(mutationsPromises);
      }

      if (allSpecsMutationsPromises.length > 0) {
        this.runMutations(allSpecsMutationsPromises);
      }

      if (voteProposalsHaveChanged) {
        const items = [];
        voteProposals.forEach((t) => {
          items.push({ ...t.toJS(), voteSessionId: voteSessionPage.get('id') });
        });
        const proposalsToDeleteOrUpdate = items.filter(item => !item.isNew);
        let mutationsPromises: Array<Promise<*>> = [];
        proposalsToDeleteOrUpdate.forEach((proposal) => {
          if (proposal.toDelete) {
            // delete all modules and then delete the proposal
            mutationsPromises = mutationsPromises.concat(
              proposal.modules.map(m => deleteVoteSpecification({ variables: createVariablesForDeleteMutation(m) }))
            );
            mutationsPromises.push(deleteProposal({ variables: createVariablesForDeleteMutation(proposal) }));
          }

          const modulesToMutate = proposal.modules.map(m => ({ ...m, voteSessionId: voteSessionPage.get('id') }));
          const modulesMutations = getMutationsForModules(modulesToMutate);
          mutationsPromises = mutationsPromises.concat(modulesMutations);

          const updateVariables = {
            ...createVariablesForProposalsMutation(proposal),
            id: proposal.id,
            lang: i18n.locale
          };
          mutationsPromises.push(updateProposal({ variables: updateVariables }));
        });
        this.runMutations(mutationsPromises);

        const proposalsToCreate = items.filter(item => item.isNew && !item.toDelete);
        proposalsToCreate.forEach((proposal) => {
          const payload = {
            variables: createVariablesForProposalsMutation(proposal)
          };

          let modulesToCreate = proposal.modules.filter(pModule => pModule.isNew && !pModule.toDelete);
          createProposal(payload).then((res) => {
            if (res.data) {
              const proposalId = res.data.createProposal.proposal.id;
              // create the modules
              modulesToCreate = modulesToCreate.map(m => ({
                ...m,
                proposalId: proposalId,
                voteSessionId: voteSessionPage.get('id')
              }));

              this.runMutations(getMutationsForModules(modulesToCreate));
            }
          });
        });
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

  type Module = Map<string, any>;
  const expandModuleData = (m: Module): Module => {
    if (m.has('choices')) {
      return m.set('choices', m.get('choices').map(c => gaugeChoicesById.get(c)));
    } else if (m.has('tokenCategories')) {
      return m.set('tokenCategories', m.get('tokenCategories').map(tc => tokenCategoriesById.get(tc)));
    }

    return m;
  };

  const voteModules = modulesInOrder.map((id) => {
    const m = modulesById.get(id);
    return expandModuleData(m);
  });

  return {
    editLocale: editLocale,
    i18n: i18n,
    tokenModulesHaveChanged: tokenModulesHaveChanged,
    textGaugeModulesHaveChanged: textGaugeModulesHaveChanged,
    numberGaugeModulesHaveChanged: numberGaugeModulesHaveChanged,
    voteProposalsHaveChanged: voteProposalsHaveChanged,
    timeline: debate.debateData.timeline,
    voteModules: voteModules,
    voteSessionPage: voteSession.page,
    voteProposals: voteProposalsInOrder.map((id) => {
      const proposal = voteProposalsById.get(id);
      const pModules = proposal
        .get('modules')
        .map(pmId => modulesById.get(pmId))
        .map(expandModuleData);

      return proposal.set('modules', pModules);
    })
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