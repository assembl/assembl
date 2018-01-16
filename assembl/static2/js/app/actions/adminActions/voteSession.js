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

export const createTokenVoteType = (id: string): actionTypes.CreateTokenVoteType => ({
  id: id,
  type: actionTypes.CREATE_TOKEN_VOTE_TYPE
});

export const deleteTokenVoteType = (value: number): actionTypes.CreateTokenVoteType => ({
  value: value,
  type: actionTypes.DELETE_TOKEN_VOTE_TYPE
});

export const updateTokenVoteTypeTitle = (id: string, locale: string, value: string): actionTypes.UpdateTokenVoteTypeTitle => ({
  id: id,
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_TYPE_TITLE
});

export const updateTokenVoteTypeColor = (id: string, value: string): actionTypes.UpdateTokenVoteTypeColor => ({
  id: id,
  value: value,
  type: actionTypes.UPDATE_TOKEN_VOTE_TYPE_COLOR
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