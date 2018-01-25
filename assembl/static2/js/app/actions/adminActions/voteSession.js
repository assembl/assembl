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

export const updateTokenVoteExclusiveCategorie = (id: string, value: boolean): actionTypes.UpdateTokenVoteExclusiveCategorie => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORIE
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

export const createTokenVoteCategorie = (id: string, parentId: string): actionTypes.CreateTokenVoteCategorie => ({
  id: id,
  parentId: parentId,
  type: actionTypes.CREATE_TOKEN_VOTE_CATEGORIE
});

export const deleteTokenVoteCategorie = (value: number, parentId: string): actionTypes.DeleteTokenVoteCategorie => ({
  parentId: parentId,
  value: value,
  type: actionTypes.DELETE_TOKEN_VOTE_CATEGORIE
});

export const updateTokenVoteCategorieTitle = (
  id: string,
  locale: string,
  value: string
): actionTypes.UpdateTokenVoteCategorieTitle => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORIE_TITLE
});

export const updateTokenTotalNumber = (id: string, value: number): actionTypes.UpdateTokenTotalNumber => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_TOKEN_TOTAL_NUMBER
});

export const updateTokenVoteCategorieColor = (id: string, value: string): actionTypes.UpdateTokenVoteCategorieColor => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_CATEGORIE_COLOR
});

export const updateVoteSessionPage = (value: Object): actionTypes.UpdateVoteSessionPage => ({
  titleEntries: value.titleEntries,
  subTitleEntries: value.subTitleEntries,
  instructionsSectionTitleEntries: value.instructionsSectionTitleEntries,
  instructionsSectionContentEntries: value.instructionsSectionContentEntries,
  propositionsSectionTitleEntries: value.propositionsSectionTitleEntries,
  headerImage: value.headerImage,
  type: actionTypes.UPDATE_VOTE_SESSION_PAGE
});