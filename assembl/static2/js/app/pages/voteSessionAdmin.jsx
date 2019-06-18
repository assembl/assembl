// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { I18n, Translate } from 'react-redux-i18n';
import { List, type Map } from 'immutable';
import { Button } from 'react-bootstrap';
import { Link, type Route, type Router } from 'react-router';

import { setValidationErrors } from '../actions/adminActions/voteSession';
import PageForm from '../components/administration/voteSession/pageForm';
import { type VoteChoice } from '../components/administration/voteSession/gaugeForm';
import ModulesSection from '../components/administration/voteSession/modulesSection';
import VoteProposalsSection from '../components/administration/voteSession/voteProposalsSection';
import BackToThematic from '../components/administration/voteSession/backToThematic';
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
import { convertEntriesToHTML, convertImmutableEntriesToJS } from '../utils/draftjs';
import { get } from '../utils/routeMap';
import { displayAlert, displayCustomModal, closeModal } from '../utils/utilityManager';
import { getDiscussionSlug } from '../utils/globalFunctions';

type VoteModule = {
  choices?: Array<VoteChoice>,
  exclusiveCategories?: boolean,
  id: string,
  instructionsEntries?: LangstringEntries,
  isCustom: boolean,
  _isNew: boolean,
  isNumberGauge?: boolean,
  labelEntries: Array<string>,
  maximum?: number,
  minimum?: number,
  nbTicks?: number,
  proposalId?: ?string,
  _toDelete: boolean,
  tokenCategories?: Array<Object>,
  type?: string,
  unit?: string,
  value: any,
  voteSpecTemplateId?: ?string,
  voteSessionId?: string,
  voteType?: string
};

type ItemWithId = { id: string } & Object;
export const createVariablesForDeleteMutation = (item: ItemWithId): { id: string } => ({ id: item.id });

export type VoteProposalMap = Map<string, *>;

type TokenInfo = {
  instructionsEntries?: LangstringEntries,
  isCustom: boolean,
  proposalId?: ?string,
  voteSpecTemplateId: ?string,
  voteSessionId: string,
  exclusiveCategories: boolean,
  tokenCategories?: Array<Object>
};
type CreateVariablesForTokenVoteSpecificationMutation = TokenInfo => Object;
const createVariablesForTokenVoteSpecificationMutation: CreateVariablesForTokenVoteSpecificationMutation = voteModule => ({
  proposalId: voteModule.proposalId,
  voteSpecTemplateId: voteModule.voteSpecTemplateId,
  voteSessionId: voteModule.voteSessionId,
  exclusiveCategories: voteModule.exclusiveCategories,
  instructionsEntries: voteModule.instructionsEntries,
  isCustom: voteModule.isCustom,
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

type TextGaugeInfo = {
  instructionsEntries?: LangstringEntries,
  isCustom: boolean,
  proposalId?: ?string,
  voteSpecTemplateId: ?string,
  voteSessionId: string,
  choices?: Array<{ id: string, labelEntries: LangstringEntries }>
};
type CreateVariablesForTextGaugeMutation = TextGaugeInfo => Object;
export const createVariablesForTextGaugeMutation: CreateVariablesForTextGaugeMutation = voteModule => ({
  proposalId: voteModule.proposalId,
  voteSpecTemplateId: voteModule.voteSpecTemplateId,
  voteSessionId: voteModule.voteSessionId,
  titleEntries: [],
  instructionsEntries: voteModule.instructionsEntries,
  isCustom: voteModule.isCustom,
  choices: voteModule.choices
    ? voteModule.choices.map((c, index) => ({
      id: c.id,
      labelEntries: c.labelEntries,
      value: index.toFixed(2)
    }))
    : []
});

type NumberGaugeInfo = {
  instructionsEntries?: LangstringEntries,
  isCustom: boolean,
  proposalId?: ?string,
  voteSpecTemplateId: ?string,
  voteSessionId: string,
  maximum: number,
  minimum: number,
  nbTicks: number,
  unit: string
};
type CreateVariablesForNumberGaugeMutation = NumberGaugeInfo => Object;
export const createVariablesForNumberGaugeMutation: CreateVariablesForNumberGaugeMutation = voteModule => ({
  proposalId: voteModule.proposalId,
  voteSpecTemplateId: voteModule.voteSpecTemplateId,
  voteSessionId: voteModule.voteSessionId,
  titleEntries: [],
  instructionsEntries: voteModule.instructionsEntries,
  isCustom: voteModule.isCustom,
  nbTicks: voteModule.nbTicks,
  minimum: voteModule.minimum,
  maximum: voteModule.maximum,
  unit: voteModule.unit
});

type VoteProposal = {
  order: number,
  voteSessionId: string,
  titleEntries: LangstringEntries,
  descriptionEntries: RichTextLangstringEntries
};
type VariablesForProposalMutation = {
  order: number,
  voteSessionId: string,
  titleEntries: LangstringEntries,
  descriptionEntries: LangstringEntries
};
export const createVariablesForProposalsMutation = (proposal: VoteProposal): VariablesForProposalMutation => ({
  order: proposal.order,
  voteSessionId: proposal.voteSessionId,
  titleEntries: proposal.titleEntries,
  descriptionEntries: convertEntriesToHTML(proposal.descriptionEntries)
});

type Props = {
  editLocale: string,
  i18n: {
    locale: string
  },
  modulesOrProposalsHaveChanged: boolean,
  refetchVoteSession: Function,
  section: string,
  voteProposals: List<VoteProposalMap>,
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
  deleteProposal: Function,
  setValidationErrors: (string, ValidationErrors) => Function,
  // voteSessionId: string,
  // debateId: string,
  route: Route,
  router: Router,
  phaseIdentifier: string,
  thematicId: string,
  goBackPhaseIdentifier: string
};

type State = {
  firstWarningDisplayed: boolean,
  secondWarningDisplayed: boolean,
  refetching: boolean
};

type TestModuleType = VoteModule => boolean;
const isTokenVoteModule: TestModuleType = m => m.voteType === 'token_vote_specification' || m.type === 'tokens';
export const isTextGaugeModule: TestModuleType = m =>
  m.voteType === 'gauge_vote_specification' || (m.type === 'gauge' && !m.isNumberGauge);
export const isNumberGaugeModule: TestModuleType = m =>
  m.voteType === 'number_gauge_vote_specification' || (m.type === 'gauge' && Boolean(m.isNumberGauge));
export const isGaugeModule: TestModuleType = m => isTextGaugeModule(m) || isNumberGaugeModule(m);

export const getProposalValidationErrors = (p: VoteProposalMap, editLocale: string): ValidationErrors => {
  const errors = {};
  if (!p.get('_toDelete')) {
    const title = p.get('titleEntries').find(e => e.get('localeCode') === editLocale);
    if (!title || title.get('value').length === 0) {
      errors.title = [{ code: 'error.required', vars: {} }];
    }

    if (p.get('modules').filter(m => !m.get('_toDelete')).size < 1) {
      errors.modules = [{ code: 'atLeastOneModule', vars: {} }];
    }
  }

  return errors;
};

class VoteSessionAdmin extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      firstWarningDisplayed: false,
      secondWarningDisplayed: false,
      refetching: false
    };
  }

  componentDidMount() {
    this.props.router.setRouteLeaveHook(this.props.route, this.routerWillLeave);
  }

  componentWillReceiveProps(nextProps) {
    const { section, thematicId, voteSessionPage, voteModules } = nextProps;
    const { firstWarningDisplayed, secondWarningDisplayed } = this.state;
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
            <Link to={`${get('voteSessionAdmin', slug, { section: stepNumber, thematicId: thematicId })}`}>
              <Button key="cancel" onClick={closeModal} className="button-cancel button-dark button-modal">
                <Translate value={buttonMessage} number={stepNumber} />
              </Button>
            </Link>
          </div>
        );

        displayCustomModal(content, true, 'modal-centered');
      }, 500);
    };

    if (!this.state.refetching) {
      if ((section === '2' || section === '3') && !voteSessionPage.get('id') && !firstWarningDisplayed) {
        showModal('administration.configureVoteSession', 'administration.saveFirstStep', 'administration.backToPreviousStep', 1);
        this.setState({ firstWarningDisplayed: true });
      }
      if (section === '3' && !voteSessionPage.get('id') && !secondWarningDisplayed) {
        showModal('administration.configureVoteSession', 'administration.saveFirstStep', 'administration.backToPreviousStep', 1);
        this.setState({ secondWarningDisplayed: true });
      } else if (section === '3' && voteModules.size < 1 && !secondWarningDisplayed) {
        showModal('administration.configureVoteModules', 'administration.saveSecondStep', 'administration.backToPreviousStep', 2);
        this.setState({ secondWarningDisplayed: true });
      }
    }
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

  runMutations(mutationsPromises) {
    const { refetchVoteSession } = this.props;
    if (mutationsPromises.length > 0) {
      runSerial(mutationsPromises).then(() => {
        this.setState({ refetching: true });
        refetchVoteSession().then(() => this.setState({ refetching: false }));
        displayAlert('success', I18n.t('administration.voteSessionSuccess'));
      });
    }
  }

  validateProposals = (proposals) => {
    let isValid = true;
    proposals.forEach((proposal) => {
      const errors = getProposalValidationErrors(proposal, this.props.editLocale);
      // we have to use Object.keys + map instead of Object.values so that flow infers arrays
      // See: https://github.com/facebook/flow/issues/2221
      const errorsCount = Object.keys(errors)
        .map(k => errors[k])
        .map(arr => arr.length)
        .reduce((acc, l) => acc + l, 0);

      this.props.setValidationErrors(proposal.get('id'), errors);
      if (errorsCount > 0) {
        isValid = false;
      }
    });

    return isValid;
  };

  saveAction = () => {
    const {
      i18n,
      modulesOrProposalsHaveChanged,
      refetchVoteSession,
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
      deleteProposal,
      thematicId
    } = this.props;

    if (voteSessionPage.get('_hasChanged')) {
      const propositionsSectionTitleEntries = voteSessionPage.get('propositionsSectionTitleEntries').toJS();
      const payload = {
        variables: {
          ideaId: thematicId,
          propositionsSectionTitleEntries: propositionsSectionTitleEntries,
          seeCurrentVotes: voteSessionPage.get('seeCurrentVotes')
        }
      };

      updateVoteSession(payload)
        .then(() => {
          this.setState({ refetching: true });
          refetchVoteSession().then(() => this.setState({ refetching: false }));
          displayAlert('success', I18n.t('administration.voteSessionSuccess'));
        })
        .catch((error) => {
          console.error(error); // eslint-disable-line no-console
          const errorMessage = I18n.t('administration.anErrorOccured');
          displayAlert('danger', errorMessage, false, 30000);
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

    const getGaugeSpecMutationsPromises = (modules) => {
      const promises = [];
      modules.forEach((module) => {
        if (isTextGaugeModule(module)) {
          const result = getMutationsPromises({
            items: [module],
            variablesCreator: createVariablesForTextGaugeMutation,
            deleteVariablesCreator: createVariablesForDeleteMutation,
            createMutation: createGaugeVoteSpecification,
            updateMutation: updateGaugeVoteSpecification,
            deleteMutation: deleteVoteSpecification,
            lang: i18n.locale
          });
          if (result.length > 0) {
            promises.push(result[0]);
          }
        } else if (isNumberGaugeModule(module)) {
          const result = getMutationsPromises({
            items: [module],
            variablesCreator: createVariablesForNumberGaugeMutation,
            deleteVariablesCreator: createVariablesForDeleteMutation,
            createMutation: createNumberGaugeVoteSpecification,
            updateMutation: updateNumberGaugeVoteSpecification,
            deleteMutation: deleteVoteSpecification,
            lang: i18n.locale
          });
          if (result.length > 0) {
            promises.push(result[0]);
          }
        }
      });
      return promises;
    };

    const getMutationsForModules = (modules) => {
      const tokenVoteModules = modules.filter(isTokenVoteModule);
      const gaugeModules = modules.filter(isGaugeModule);
      return getTokenVoteSpecMutationsPromises(tokenVoteModules).concat(getGaugeSpecMutationsPromises(gaugeModules));
    };
    const voteSessionPageId = voteSessionPage.get('id');

    if (voteSessionPage.get('id')) {
      if (modulesOrProposalsHaveChanged) {
        // mutations for modules templates
        const modules = voteModules.map(m => ({ ...m.toJS(), voteSessionId: voteSessionPageId })).toArray();

        const allSpecsMutationsPromises = getMutationsForModules(modules);
        this.runMutations(allSpecsMutationsPromises);

        let proposalsAndModulesMutations: Array<() => Promise<*>> = [];

        // mutations for proposals and their modules
        const isValid = this.validateProposals(voteProposals);
        if (!isValid) {
          displayAlert('danger', I18n.t('administration.anErrorOccured'));
          return;
        }

        const items = [];
        voteProposals.forEach((vp) => {
          items.push({
            ...vp.toJS(),
            descriptionEntries: convertImmutableEntriesToJS(vp.get('descriptionEntries')),
            voteSessionId: voteSessionPageId
          });
        });
        const proposalsToDeleteOrUpdate = items.filter(item => !item._isNew);
        let mutationsPromises: Array<() => Promise<*>> = [];
        proposalsToDeleteOrUpdate.forEach((proposal) => {
          if (proposal._toDelete) {
            // delete all modules and then delete the proposal
            mutationsPromises = mutationsPromises.concat(
              proposal.modules.map(m => deleteVoteSpecification({ variables: createVariablesForDeleteMutation(m) }))
            );
            mutationsPromises.push(() => deleteProposal({ variables: createVariablesForDeleteMutation(proposal) }));
          }

          // we have to mutate the modules even if the proposal has not changed
          const modulesToMutate = proposal.modules.map(m => ({ ...m, voteSessionId: voteSessionPageId }));
          const modulesMutations = getMutationsForModules(modulesToMutate);
          mutationsPromises = mutationsPromises.concat(modulesMutations);

          if (proposal._hasChanged) {
            const updateVariables = {
              ...createVariablesForProposalsMutation(proposal),
              id: proposal.id,
              lang: i18n.locale
            };
            mutationsPromises.push(() => updateProposal({ variables: updateVariables }));
          }
        });

        proposalsAndModulesMutations = proposalsAndModulesMutations.concat(mutationsPromises);

        const proposalsToCreate = items.filter(item => item._isNew && !item._toDelete);
        const proposalsMutations = [];
        proposalsToCreate.forEach((proposal) => {
          const payload = {
            variables: createVariablesForProposalsMutation(proposal)
          };

          let modulesToCreate = proposal.modules.filter(pModule => pModule._isNew && !pModule._toDelete);
          const createProposalPromise = () =>
            createProposal(payload).then((res) => {
              if (res.data) {
                const proposalId = res.data.createProposal.proposal.id;
                // create the modules
                modulesToCreate = modulesToCreate.map(m => ({
                  ...m,
                  proposalId: proposalId,
                  voteSessionId: voteSessionPageId
                }));

                this.runMutations(getMutationsForModules(modulesToCreate));
              }
            });

          proposalsMutations.push(createProposalPromise);
        }); // end proposalsToCreate.forEach

        proposalsAndModulesMutations = proposalsAndModulesMutations.concat(proposalsMutations);
        this.runMutations(proposalsAndModulesMutations);
      }
    }
  };

  dataHaveChanged = (): boolean => this.props.modulesOrProposalsHaveChanged || this.props.voteSessionPage.get('_hasChanged');

  render() {
    const { editLocale, goBackPhaseIdentifier, phaseIdentifier, section, thematicId } = this.props;
    const saveDisabled = !this.dataHaveChanged();
    const configureThematicUrl = get(
      'administration',
      { slug: getDiscussionSlug() || '', id: goBackPhaseIdentifier },
      { section: 'configThematics', thematicId: thematicId }
    );
    return (
      <div className="token-vote-admin">
        <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />
        {section === '1' && <PageForm editLocale={editLocale} />}
        {section === '2' && <ModulesSection />}
        {section === '3' && <VoteProposalsSection />}
        {section && (
          <Navbar
            currentStep={section}
            steps={['1', '2', '3']}
            phaseIdentifier={phaseIdentifier}
            queryArgs={{ thematicId: thematicId, goBackPhaseIdentifier: goBackPhaseIdentifier }}
          />
        )}
        <BackToThematic url={configureThematicUrl} />
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { editLocale, voteSession }, i18n, context, timeline }) => {
  const {
    modulesById,
    modulesInOrder,
    tokenCategoriesById,
    gaugeChoicesById,
    modulesOrProposalsHaveChanged,
    voteProposalsById,
    page
  } = voteSession;

  type Module = Map<string, any>;
  const expandModuleData = (initialModule: Module): Module => {
    let m = initialModule;
    if (!m.get('isCustom')) {
      if (m.get('voteSpecTemplateId') !== null) {
        const template = modulesById
          .get(m.get('voteSpecTemplateId'))
          // remove fields that we don't want to override
          .delete('id')
          .delete('isCustom')
          .delete('_hasChanged')
          .delete('_isNew')
          .delete('proposalId')
          .delete('_toDelete')
          .delete('voteSpecTemplateId');
        m = m.merge(template);
      }
    }

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
    modulesOrProposalsHaveChanged: modulesOrProposalsHaveChanged,
    timeline: timeline,
    voteModules: voteModules,
    voteSessionPage: voteSession.page,
    debateId: context.debateId,
    voteSessionId: page.get('id'),
    voteProposals: voteProposalsById
      .map((proposal) => {
        const pModules = proposal
          .get('modules')
          .map(pmId => modulesById.get(pmId))
          .map(expandModuleData);

        return proposal.set('modules', pModules);
      })
      .sortBy(proposal => proposal.get('order'))
  };
};

const mapDispatchToProps = dispatch => ({
  setValidationErrors: (id, errors) => dispatch(setValidationErrors(id, errors))
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
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