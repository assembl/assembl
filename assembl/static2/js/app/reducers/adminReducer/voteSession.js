// @flow
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';
import {
  type Action,
  UPDATE_VOTE_SESSION_PAGE_TITLE,
  UPDATE_VOTE_SESSION_PAGE_SUBTITLE,
  UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_TITLE,
  UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_CONTENT,
  UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE,
  UPDATE_VOTE_SESSION_PAGE_IMAGE,
  UPDATE_VOTE_SESSION_PAGE,
  UPDATE_VOTE_MODULES,
  CREATE_TOKEN_VOTE_MODULE,
  UPDATE_TOKEN_VOTE_INSTRUCTIONS,
  CREATE_TOKEN_VOTE_TYPE,
  DELETE_TOKEN_VOTE_TYPE,
  UPDATE_TOKEN_VOTE_TYPE_TITLE,
  UPDATE_TOKEN_VOTE_TYPE_COLOR
} from '../../actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';

const initialPage = Map({
  hasChanged: false,
  titleEntries: List(),
  subTitleEntries: List(),
  instructionsSectionTitleEntries: List(),
  instructionsSectionContentEntries: List(),
  propositionsSectionTitleEntries: List(),
  headerImage: Map({
    externalUrl: '',
    mimeType: '',
    title: ''
  })
});
export type VoteSessionPageReducer = (Map, ReduxAction<Action>) => Map;
export const voteSessionPage: VoteSessionPageReducer = (state = initialPage, action) => {
  switch (action.type) {
  case UPDATE_VOTE_SESSION_PAGE_TITLE:
    return state.update('titleEntries', updateInLangstringEntries(action.locale, fromJS(action.value))).set('hasChanged', true);
  case UPDATE_VOTE_SESSION_PAGE_SUBTITLE:
    return state
      .update('subTitleEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('hasChanged', true);
  case UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_TITLE:
    return state
      .update('instructionsSectionTitleEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('hasChanged', true);
  case UPDATE_VOTE_SESSION_PAGE_INSTRUCTIONS_CONTENT:
    return state
      .update('instructionsSectionContentEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('hasChanged', true);
  case UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE:
    return state
      .update('propositionsSectionTitleEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('hasChanged', true);
  case UPDATE_VOTE_SESSION_PAGE_IMAGE:
    return state
      .setIn(['headerImage', 'externalUrl'], action.value)
      .setIn(['headerImage', 'mimeType'], action.value.type)
      .set('hasChanged', true);
  case UPDATE_VOTE_SESSION_PAGE: {
    return Map({
      hasChanged: false,
      titleEntries: fromJS(action.titleEntries),
      subTitleEntries: fromJS(action.subTitleEntries),
      instructionsSectionTitleEntries: fromJS(action.instructionsSectionTitleEntries),
      instructionsSectionContentEntries: fromJS(action.instructionsSectionContentEntries),
      propositionsSectionTitleEntries: fromJS(action.propositionsSectionTitleEntries),
      headerImage: Map({
        externalUrl: fromJS(action.headerImage.externalUrl),
        mimeType: fromJS(action.headerImage.mimeType)
      })
    });
  }
  default:
    return state;
  }
};

export const modulesInOrder = (state: List<number> = List(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_MODULES:
    return List(action.voteModules.map(m => m.id));
  case CREATE_TOKEN_VOTE_MODULE:
    return state.push(action.id);
  default:
    return state;
  }
};

const defaultTokenModule = Map({
  type: 'tokens',
  titleEntries: List(),
  instructionsEntries: List(),
  exclusive: false,
  tokenTypes: List()
});

export const modulesById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_MODULES: {
    let newState = Map();
    action.voteModules.forEach((m) => {
      let moduleInfo = Map();
      moduleInfo = Map({
        type: m.type,
        id: m.id,
        titleEntries: fromJS(m.titleEntries),
        instructionsEntries: fromJS(m.instructionsEntries),
        exclusive: m.exclusive,
        tokenTypes: fromJS(m.tokenTypes)
      });
      newState = newState.set(m.id, moduleInfo);
    });
    return newState;
  }
  case CREATE_TOKEN_VOTE_MODULE:
    return state.set(action.id, defaultTokenModule.set('id', action.id));
  case UPDATE_TOKEN_VOTE_INSTRUCTIONS:
    return state.updateIn([action.id, 'instructionsEntries'], updateInLangstringEntries(action.locale, action.value));
  default:
    return state;
  }
};

export const tokenTypesInOrder = (state: List<number> = List(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_MODULES: {
    let tokenTypes = List();
    action.voteModules.forEach((m) => {
      if (m.type === 'tokens') {
        tokenTypes = List(m.tokenTypes.map(t => t.id));
      }
    });
    return tokenTypes;
  }
  case CREATE_TOKEN_VOTE_TYPE:
    return state.push(action.id);
  case DELETE_TOKEN_VOTE_TYPE: {
    let newState = state;
    const numberToDelete = state.size - action.value;
    for (let i = 0; i < numberToDelete; i += 1) {
      newState = newState.delete(newState.size - 1);
    }
    return newState;
  }
  default:
    return state;
  }
};

const initialTokenType = Map({
  id: '',
  titleEntries: List(),
  number: 0,
  color: ''
});

export const tokenTypesById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_MODULES: {
    let newState = Map();
    action.voteModules.forEach((m) => {
      if (m.type === 'tokens') {
        m.tokenTypes.forEach((t) => {
          let tokenTypeInfo = Map();
          tokenTypeInfo = Map({
            id: t.id,
            titleEntries: fromJS(t.titleEntries),
            color: t.color,
            number: t.number
          });
          newState = newState.set(t.id, tokenTypeInfo);
        });
      }
    });
    return newState;
  }
  case CREATE_TOKEN_VOTE_TYPE:
    return state.set(action.id, initialTokenType.set('id', action.id));
  case UPDATE_TOKEN_VOTE_TYPE_TITLE:
    return state.updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  case UPDATE_TOKEN_VOTE_TYPE_COLOR:
    return state.setIn([action.id, 'color'], action.value);
  default:
    return state;
  }
};

export default combineReducers({
  page: voteSessionPage,
  modulesInOrder: modulesInOrder,
  modulesById: modulesById,
  tokenTypesInOrder: tokenTypesInOrder,
  tokenTypesById: tokenTypesById
});