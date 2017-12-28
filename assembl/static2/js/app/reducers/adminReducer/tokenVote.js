// @flow
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';

import {
  type Action,
  UPDATE_TOKEN_PAGE_TITLE,
  UPDATE_TOKEN_PAGE_DESCRIPTION,
  UPDATE_TOKEN_PAGE_INSTRUCTIONS_TITLE,
  UPDATE_TOKEN_PAGE_INSTRUCTIONS_DESCRIPTION,
  UPDATE_TOKEN_PAGE_PROPOSALS_TITLE,
  UPDATE_TOKEN_PAGE_IMAGE,
  UPDATE_TOKEN_PAGE
} from '../../actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';

const initialState = Map({
  hasChanged: false,
  titleEntries: List(),
  descriptionEntries: List(),
  instructionsTitleEntries: List(),
  instructionsDescriptionEntries: List(),
  proposalsTitleEntries: List(),
  headerImage: Map({
    externalUrl: '',
    mimeType: '',
    title: ''
  })
});

export type TokenVoteReducer = (Map, ReduxAction<Action>) => Map;
const tokenVote: TokenVoteReducer = (state = initialState, action) => {
  switch (action.type) {
  case UPDATE_TOKEN_PAGE_TITLE:
    return state.update('titleEntries', updateInLangstringEntries(action.locale, fromJS(action.value))).set('hasChanged', true);
  case UPDATE_TOKEN_PAGE_DESCRIPTION:
    return state
      .update('descriptionEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('hasChanged', true);
  case UPDATE_TOKEN_PAGE_INSTRUCTIONS_TITLE:
    return state
      .update('instructionsTitleEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('hasChanged', true);
  case UPDATE_TOKEN_PAGE_INSTRUCTIONS_DESCRIPTION:
    return state
      .update('instructionsDescriptionEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('hasChanged', true);
  case UPDATE_TOKEN_PAGE_PROPOSALS_TITLE:
    return state
      .update('proposalsTitleEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('hasChanged', true);
  case UPDATE_TOKEN_PAGE_IMAGE:
    return state
      .setIn(['headerImage', 'externalUrl'], action.value)
      .setIn(['headerImage', 'mimeType'], action.value.type)
      .set('hasChanged', true);
  case UPDATE_TOKEN_PAGE: {
    return Map({
      hasChanged: false,
      titleEntries: fromJS(action.titleEntries),
      descriptionEntries: fromJS(action.descriptionEntries),
      instructionsTitleEntries: fromJS(action.instructionsTitleEntries),
      instructionsDescriptionEntries: fromJS(action.instructionsDescriptionEntries),
      proposalsTitleEntries: fromJS(action.proposalsTitleEntries),
      headerImage: Map({
        externalUrl: action.headerImage.externalUrl,
        mimeType: action.headerImage.mimeType,
        title: ''
      })
    });
  }
  default:
    return state;
  }
};

export default tokenVote;