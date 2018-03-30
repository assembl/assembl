// @flow
import * as actionTypes from '../actionTypes';
import { createRandomId } from '../../utils/globalFunctions';

export const updateVoteSessionPageTitle = (locale: string, value: string): actionTypes.UpdateVoteSessionPageTitle => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE_TITLE
});

export const updateVoteSessionPageSeeCurrentVotes = (value: string): actionTypes.UpdateVoteSessionPageSeeCurrentVotes => ({
  value: value,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE_SEECURRENTVOTES
});

export const updateVoteSessionPageSubtitle = (locale: string, value: string): actionTypes.UpdateVoteSessionPageSubtitle => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE_SUBTITLE
});

export const updateVoteSessionPageInstructionsTitle = (
  locale: string,
  value: string
): actionTypes.UpdateVoteSessionPageInstructionsTitle => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_TITLE
});

export const updateVoteSessionPageInstructionsContent = (
  locale: string,
  value: string
): actionTypes.UpdateVoteSessionPageInstructionsContent => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_CONTENT
});

export const updateVoteSessionPagePropositionsTitle = (
  locale: string,
  value: string
): actionTypes.UpdateVoteSessionPagePropositionsTitle => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE
});

export const updateVoteSessionHeaderImage = (value: File): actionTypes.UpdateVoteSessionHeaderImage => ({
  value: value,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE_IMAGE
});

export const updateVoteModules = (voteModules: actionTypes.VoteModulesArray): actionTypes.UpdateVoteModules => ({
  voteModules: voteModules,
  type: actionTypes.UPDATE_VOTE_MODULES
});

export const createTokenVoteModule = (id: string): actionTypes.CreateTokenVoteModule => ({
  id: id,
  type: actionTypes.CREATE_TOKEN_VOTE_MODULE
});

export const deleteVoteModule = (id: string): actionTypes.DeleteVoteModule => ({
  id: id,
  type: actionTypes.DELETE_VOTE_MODULE
});

export const createGaugeVoteModule = (id: string): actionTypes.CreateGaugeVoteModule => ({
  id: id,
  type: actionTypes.CREATE_GAUGE_VOTE_MODULE
});

export const updateTokenVoteExclusiveCategory = (id: string, value: boolean): actionTypes.UpdateTokenVoteExclusiveCategory => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY
});

export const updateTokenVoteInstructions = (
  id: string,
  locale: string,
  value: string
): actionTypes.UpdateTokenVoteInstructions => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_INSTRUCTIONS
});

export const createTokenVoteCategory = (id: string, moduleId: string): actionTypes.CreateTokenVoteCategory => ({
  id: id,
  moduleId: moduleId,
  type: actionTypes.CREATE_TOKEN_VOTE_CATEGORY
});

export const deleteTokenVoteCategory = (moduleId: string, index: number): actionTypes.DeleteTokenVoteCategory => ({
  moduleId: moduleId,
  index: index,
  type: actionTypes.DELETE_TOKEN_VOTE_CATEGORY
});

export const updateTokenVoteCategoryTitle = (
  id: string,
  locale: string,
  value: string,
  moduleId: string
): actionTypes.UpdateTokenVoteCategoryTitle => ({
  moduleId: moduleId,
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_TITLE
});

export const updateTokenTotalNumber = (id: string, value: number, moduleId: string): actionTypes.UpdateTokenTotalNumber => ({
  moduleId: moduleId,
  id: id,
  value: value,
  type: actionTypes.UPDATE_TOKEN_TOTAL_NUMBER
});

export const updateTokenVoteCategoryColor = (
  id: string,
  value: string,
  moduleId: string
): actionTypes.UpdateTokenVoteCategoryColor => ({
  moduleId: moduleId,
  id: id,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_COLOR
});

export const updateGaugeVoteInstructions = (
  id: string,
  locale: string,
  value: string
): actionTypes.UpdateGaugeVoteInstructions => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_GAUGE_VOTE_INSTRUCTIONS
});

export const updateGaugeVoteIsNumber = (id: string, value: boolean): actionTypes.UpdateGaugeVoteIsNumber => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_GAUGE_VOTE_IS_NUMBER
});

export const updateGaugeVoteNbTicks = (id: string, value: number): actionTypes.UpdateGaugeVoteNbTicks => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_GAUGE_VOTE_NUMBER_TICKS
});

export const createGaugeVoteChoice = (moduleId: string, id: string): actionTypes.CreateGaugeVoteChoice => ({
  moduleId: moduleId,
  id: id,
  type: actionTypes.CREATE_GAUGE_VOTE_CHOICE
});

export const deleteGaugeVoteChoice = (moduleId: string, index: number): actionTypes.DeleteGaugeVoteChoice => ({
  moduleId: moduleId,
  index: index,
  type: actionTypes.DELETE_GAUGE_VOTE_CHOICE
});

export const updateGaugeVoteChoiceLabel = (
  id: string,
  locale: string,
  value: string,
  moduleId: string
): actionTypes.UpdateGaugeVoteChoiceLabel => ({
  moduleId: moduleId,
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_GAUGE_VOTE_CHOICE_LABEL
});

export const updateGaugeMinimum = (id: string, value: number): actionTypes.UpdateGaugeMinimum => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_GAUGE_MINIMUM
});

export const updateGaugeMaximum = (id: string, value: number): actionTypes.UpdateGaugeMaximum => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_GAUGE_MAXIMUM
});

export const updateGaugeUnit = (id: string, value: string): actionTypes.UpdateGaugeUnit => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_GAUGE_UNIT
});

export const updateVoteSessionPage = (value: Object): actionTypes.UpdateVoteSessionPage => ({
  id: value.id,
  titleEntries: value.titleEntries,
  seeCurrentVotes: value.seeCurrentVotes,
  subTitleEntries: value.subTitleEntries,
  instructionsSectionTitleEntries: value.instructionsSectionTitleEntries,
  instructionsSectionContentEntries: value.instructionsSectionContentEntries,
  propositionsSectionTitleEntries: value.propositionsSectionTitleEntries,
  headerImage: value.headerImage,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE
});

export const updateVoteProposals = (voteProposals: actionTypes.VoteProposalsArray): actionTypes.UpdateVoteProposals => ({
  voteProposals: voteProposals,
  type: actionTypes.UPDATE_VOTE_PROPOSALS
});

export const createVoteProposal = (id: string): actionTypes.CreateVoteProposal => ({
  id: id,
  type: actionTypes.CREATE_VOTE_PROPOSAL
});

export const deleteVoteProposal = (id: string): actionTypes.DeleteVoteProposal => ({
  id: id,
  type: actionTypes.DELETE_VOTE_PROPOSAL
});

export const updateVoteProposalTitle = (id: string, locale: string, value: string): actionTypes.UpdateVoteProposalTitle => ({
  id: id,
  value: value,
  locale: locale,
  type: actionTypes.UPDATE_VOTE_PROPOSAL_TITLE
});

export const updateVoteProposalDescription = (
  id: string,
  locale: string,
  value: string
): actionTypes.UpdateVoteProposalDescription => ({
  id: id,
  value: value,
  locale: locale,
  type: actionTypes.UPDATE_VOTE_PROPOSAL_DESCRIPTION
});

export const moveProposalUp = (id: string): actionTypes.MoveProposalUp => ({
  id: id,
  type: actionTypes.MOVE_PROPOSAL_UP
});

export const moveProposalDown = (id: string): actionTypes.MoveProposalDown => ({
  id: id,
  type: actionTypes.MOVE_PROPOSAL_DOWN
});

export const addModuleToProposal = (
  id: string,
  proposalId: string,
  voteSpecTemplateId: string
): actionTypes.AddModuleToProposal => ({
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

export const undeleteModule = (id: string): actionTypes.UndeleteModule => ({
  id: id,
  type: actionTypes.UNDELETE_MODULE
});

/* if a vote spec template params changes, set _hasChanged to true on all its dependencies */
export const markAllDependenciesAsChanged = (id: string): actionTypes.MarkAllDependenciesAsChanged => ({
  id: id,
  type: actionTypes.MARK_ALL_DEPENDENCIES_AS_CHANGED
});

export const setValidationErrors = (id: string, errors: ValidationErrors): actionTypes.SetValidationErrors => ({
  errors: errors,
  id: id,
  type: actionTypes.SET_VALIDATION_ERRORS
});

export const cancelModuleCustomization = (id: string): actionTypes.CancelModuleCustomization => ({
  id: id,
  type: actionTypes.CANCEL_MODULE_CUSTOMIZATION
});