// @flow
import * as actionTypes from '../actionTypes';

export const updateVoteSessionPageTitle = (locale: string, value: string): actionTypes.UpdateVoteSessionPageTitle => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE_TITLE
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

export const deleteTokenVoteModule = (id: string): actionTypes.DeleteTokenVoteModule => ({
  id: id,
  type: actionTypes.DELETE_TOKEN_VOTE_MODULE
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

export const createTokenVoteCategory = (id: string, parentId: string): actionTypes.CreateTokenVoteCategory => ({
  id: id,
  parentId: parentId,
  type: actionTypes.CREATE_TOKEN_VOTE_CATEGORY
});

export const deleteTokenVoteCategory = (value: number, parentId: string): actionTypes.DeleteTokenVoteCategory => ({
  parentId: parentId,
  value: value,
  type: actionTypes.DELETE_TOKEN_VOTE_CATEGORY
});

export const updateTokenVoteCategoryTitle = (
  id: string,
  locale: string,
  value: string
): actionTypes.UpdateTokenVoteCategoryTitle => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_TITLE
});

export const updateTokenTotalNumber = (id: string, value: number): actionTypes.UpdateTokenTotalNumber => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_TOKEN_TOTAL_NUMBER
});

export const updateTokenVoteCategoryColor = (id: string, value: string): actionTypes.UpdateTokenVoteCategoryColor => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_COLOR
});

export const updateVoteSessionPage = (value: Object): actionTypes.UpdateVoteSessionPage => ({
  id: value.id,
  titleEntries: value.titleEntries,
  subTitleEntries: value.subTitleEntries,
  instructionsSectionTitleEntries: value.instructionsSectionTitleEntries,
  instructionsSectionContentEntries: value.instructionsSectionContentEntries,
  propositionsSectionTitleEntries: value.propositionsSectionTitleEntries,
  headerImage: value.headerImage,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE
});

export const updateVoteProposals = (voteProposals: ActionTypes.VoteProposalsArray): actionTypes.UpdateVoteProposals => ({
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

export const updateVoteProposalTitle = (id: string, value: string, locale: string): actionTypes.UpdateVoteProposalTitle => ({
  id: id,
  value: value,
  locale: locale,
  type: actionTypes.UPDATE_VOTE_PROPOSAL_TITLE
});

export const updateVoteProposalDescription = (
  id: string,
  value: string,
  locale: string
): actionTypes.UpdateVoteProposalDescription => ({
  id: id,
  value: value,
  locale: locale,
  type: actionTypes.UPDATE_VOTE_PROPOSAL_DESCRIPTION
});