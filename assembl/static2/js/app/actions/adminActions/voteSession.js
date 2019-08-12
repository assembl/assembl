// @flow
import * as actionTypes from '../actionTypes';
import { createRandomId } from '../../utils/globalFunctions';

// Type definition
type ModuleInfo = { id: string };
type VoteProposalInfo = { id: string };
type VoteSession = {
  id: string,
  seeCurrentVotes: boolean,
  propositionsSectionTitleEntries: Array<any>
};

export const updateVoteSessionPageSeeCurrentVotes = (value: boolean) => ({
  value: value,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE_SEECURRENTVOTES
});

export const updateVoteSessionPagePropositionsTitle = (locale: string, value: string) => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE
});

export const deleteVoteModule = (id: string) => ({
  id: id,
  type: actionTypes.DELETE_VOTE_MODULE
});

export const undeleteModule = (id: string) => ({
  id: id,
  type: actionTypes.UNDELETE_MODULE
});

/* if a vote spec template params changes, set _hasChanged to true on all its dependencies */
export const markAllDependenciesAsChanged = (id: string) => ({
  id: id,
  type: actionTypes.MARK_ALL_DEPENDENCIES_AS_CHANGED
});

export const setValidationErrors = (id: string, errors: ValidationErrors) => ({
  errors: errors,
  id: id,
  type: actionTypes.SET_VALIDATION_ERRORS
});

export const cancelModuleCustomization = (id: string) => ({
  id: id,
  type: actionTypes.CANCEL_MODULE_CUSTOMIZATION
});

export const cancelAllDependenciesCustomization = (id: string) => (dispatch: Function, getState: Function) => {
  getState()
    .admin.voteSession.modulesById.filter(voteSpec => voteSpec.get('voteSpecTemplateId') === id)
    .forEach((voteSpec) => {
      const voteSpecId = voteSpec.get('id');
      dispatch(cancelModuleCustomization(voteSpecId));
    });
};

export const updateVoteModule = (id: string, locale: string, info: { [string]: any }) => ({
  id: id,
  info: info,
  locale: locale,
  type: actionTypes.UPDATE_VOTE_MODULE
});

export const updateVoteModules = (voteModules: Array<ModuleInfo>) => ({
  voteModules: voteModules,
  type: actionTypes.UPDATE_VOTE_MODULES
});

export const createTokenVoteModule = (id: string) => ({
  id: id,
  type: actionTypes.CREATE_TOKEN_VOTE_MODULE
});

export const createGaugeVoteModule = (id: string) => ({
  id: id,
  type: actionTypes.CREATE_GAUGE_VOTE_MODULE
});

export const updateTokenVoteExclusiveCategory = (id: string, value: boolean) => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY
});

export const updateTokenVoteInstructions = (id: string, locale: string, value: string) => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_INSTRUCTIONS
});

export const createTokenVoteCategory = (id: string, moduleId: string) => ({
  id: id,
  moduleId: moduleId,
  type: actionTypes.CREATE_TOKEN_VOTE_CATEGORY
});

export const deleteTokenVoteCategory = (moduleId: string, index: number) => ({
  moduleId: moduleId,
  index: index,
  type: actionTypes.DELETE_TOKEN_VOTE_CATEGORY
});

export const updateTokenVoteCategoryTitle = (id: string, locale: string, value: string, moduleId: string) => ({
  id: id,
  locale: locale,
  value: value,
  moduleId: moduleId,
  type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_TITLE
});

export const updateTokenTotalNumber = (id: string, value: number, moduleId: string) => ({
  id: id,
  value: value,
  moduleId: moduleId,
  type: actionTypes.UPDATE_TOKEN_TOTAL_NUMBER
});

export const updateTokenVoteCategoryColor = (id: string, value: string, moduleId: string) => ({
  id: id,
  value: value,
  moduleId: moduleId,
  type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_COLOR
});

export const updateGaugeVoteInstructions = (id: string, locale: string, value: string) => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_GAUGE_VOTE_INSTRUCTIONS
});

export const updateGaugeVoteIsNumber = (id: string, value: boolean) => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_GAUGE_VOTE_IS_NUMBER
});

export const updateGaugeVoteNbTicks = (id: string, value: number) => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_GAUGE_VOTE_NUMBER_TICKS
});

export const createGaugeVoteChoice = (moduleId: string, id: string) => ({
  moduleId: moduleId,
  id: id,
  type: actionTypes.CREATE_GAUGE_VOTE_CHOICE
});

export const deleteGaugeVoteChoice = (moduleId: string, index: number) => ({
  moduleId: moduleId,
  index: index,
  type: actionTypes.DELETE_GAUGE_VOTE_CHOICE
});

export const updateGaugeVoteChoiceLabel = (id: string, locale: string, value: string, moduleId: string) => ({
  id: id,
  locale: locale,
  value: value,
  moduleId: moduleId,
  type: actionTypes.UPDATE_GAUGE_VOTE_CHOICE_LABEL
});

export const updateGaugeMinimum = (id: string, value: number) => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_GAUGE_MINIMUM
});

export const updateGaugeMaximum = (id: string, value: number) => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_GAUGE_MAXIMUM
});

export const updateGaugeUnit = (id: string, value: string) => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_GAUGE_UNIT
});

export const updateVoteSessionPage = (value: VoteSession) => ({
  id: value.id,
  seeCurrentVotes: value.seeCurrentVotes,
  propositionsSectionTitleEntries: value.propositionsSectionTitleEntries,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE
});

export const updateVoteProposals = (voteProposals: Array<VoteProposalInfo>) => ({
  voteProposals: voteProposals,
  type: actionTypes.UPDATE_VOTE_PROPOSALS
});

export const createVoteProposal = (id: string) => ({
  id: id,
  type: actionTypes.CREATE_VOTE_PROPOSAL
});

export const deleteVoteProposal = (id: string) => ({
  id: id,
  type: actionTypes.DELETE_VOTE_PROPOSAL
});

export const updateVoteProposalTitle = (id: string, locale: string, value: string) => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_VOTE_PROPOSAL_TITLE
});

export const updateVoteProposalDescription = (id: string, locale: string, value: string) => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_VOTE_PROPOSAL_DESCRIPTION
});

export const moveProposalUp = (id: string) => ({
  id: id,
  type: actionTypes.MOVE_PROPOSAL_UP
});

export const moveProposalDown = (id: string) => ({
  id: id,
  type: actionTypes.MOVE_PROPOSAL_DOWN
});

export const addModuleToProposal = (id: string, proposalId: string, voteSpecTemplateId: string) => ({
  id: id,
  proposalId: proposalId,
  voteSpecTemplateId: voteSpecTemplateId,
  type: actionTypes.ADD_MODULE_TO_PROPOSAL
});

export const createVoteProposalAndModules = (id: string) => (dispatch: Function, getState: Function) => {
  dispatch(createVoteProposal(id));
  const { modulesInOrder } = getState().admin.voteSession;
  modulesInOrder.forEach(moduleId => dispatch(addModuleToProposal(createRandomId(), id, moduleId)));
};