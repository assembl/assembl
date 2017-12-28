// @flow
import * as actionTypes from '../actionTypes';

export const updateTokenVotePageTitle = (locale: string, value: string): actionTypes.UpdateTokenVotePageTitle => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TOKEN_PAGE_TITLE
});

export const updateTokenVotePageDescription = (locale: string, value: string): actionTypes.UpdateTokenVotePageDescription => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TOKEN_PAGE_DESCRIPTION
});

export const updateTokenVotePageInstructionsTitle = (
  locale: string,
  value: string
): actionTypes.UpdateTokenVotePageInstructionsTitle => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TOKEN_PAGE_INSTRUCTIONS_TITLE
});

export const updateTokenVotePageInstructionsDescription = (
  locale: string,
  value: string
): actionTypes.UpdateTokenVotePageInstructionsDescription => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TOKEN_PAGE_INSTRUCTIONS_DESCRIPTION
});

export const updateTokenVotePageProposalsTitle = (
  locale: string,
  value: string
): actionTypes.UpdateTokenVotePageProposalsTitle => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TOKEN_PAGE_PROPOSALS_TITLE
});

export const updateTokenVoteHeaderImage = (value: File): actionTypes.UpdateTokenVoteHeaderImage => ({
  value: value,
  type: actionTypes.UPDATE_TOKEN_PAGE_IMAGE
});

export const updateTokenVotePage = (
  titleEntries: Array<any>,
  descriptionEntries: Array<any>,
  instructionsTitleEntries: Array<any>,
  instructionsDescriptionEntries: Array<any>,
  proposalsTitleEntries: Array<any>,
  headerImage: File | null
): actionTypes.UpdateTokenVotePage => ({
  titleEntries: titleEntries,
  descriptionEntries: descriptionEntries,
  instructionsTitleEntries: instructionsTitleEntries,
  instructionsDescriptionEntries: instructionsDescriptionEntries,
  proposalsTitleEntries: proposalsTitleEntries,
  headerImage: headerImage,
  type: actionTypes.UPDATE_TOKEN_PAGE
});