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
  DELETE_TOKEN_VOTE_MODULE,
  UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY,
  UPDATE_TOKEN_VOTE_INSTRUCTIONS,
  CREATE_TOKEN_VOTE_CATEGORY,
  DELETE_TOKEN_VOTE_CATEGORY,
  UPDATE_TOKEN_VOTE_CATEGORY_TITLE,
  UPDATE_TOKEN_TOTAL_NUMBER,
  UPDATE_TOKEN_VOTE_CATEGORY_COLOR,
  UPDATE_VOTE_PROPOSALS,
  CREATE_VOTE_PROPOSAL,
  DELETE_VOTE_PROPOSAL,
  UPDATE_VOTE_PROPOSAL_TITLE,
  UPDATE_VOTE_PROPOSAL_DESCRIPTION
} from '../../actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';

const initialPage = Map({
  hasChanged: false,
  id: '',
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
      id: fromJS(action.id),
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

export const modulesHaveChanged = (state: boolean = false, action: ReduxAction<Action>) => {
  switch (action.type) {
  case CREATE_TOKEN_VOTE_MODULE:
  case DELETE_TOKEN_VOTE_MODULE:
  case UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY:
  case UPDATE_TOKEN_VOTE_INSTRUCTIONS:
  case CREATE_TOKEN_VOTE_CATEGORY:
  case DELETE_TOKEN_VOTE_CATEGORY:
  case UPDATE_TOKEN_VOTE_CATEGORY_TITLE:
  case UPDATE_TOKEN_VOTE_CATEGORY_COLOR:
  case UPDATE_TOKEN_TOTAL_NUMBER:
    return true;
  case UPDATE_VOTE_MODULES:
    return false;
  default:
    return state;
  }
};

export const modulesInOrder = (state: List<number> = List(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_MODULES:
    return List(Object.keys(action.voteModules).map(key => action.voteModules[key].id || null));
  case CREATE_TOKEN_VOTE_MODULE:
    return state.push(action.id);
  default:
    return state;
  }
};

const defaultTokenModule = Map({
  isNew: true,
  toDelete: false,
  type: 'tokens',
  titleEntries: List(),
  instructionsEntries: List(),
  exclusiveCategories: false,
  tokenCategories: List()
});

export const modulesById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_MODULES: {
    let newState = Map();
    action.voteModules.forEach((m) => {
      if (m.type === 'tokens') {
        const moduleInfo = fromJS({
          isNew: false,
          toDelete: false,
          type: m.type,
          id: m.id,
          titleEntries: m.titleEntries,
          instructionsEntries: m.instructionsEntries,
          exclusiveCategories: m.exclusiveCategories,
          tokenCategories: m.tokenCategories.map(t => t.id)
        });
        newState = newState.set(m.id, moduleInfo);
      }
    });
    return newState;
  }
  case CREATE_TOKEN_VOTE_MODULE:
    return state.set(action.id, defaultTokenModule.set('id', action.id));
  case DELETE_TOKEN_VOTE_MODULE:
    return state.setIn([action.id, 'toDelete'], true);
  case UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY:
    return state.setIn([action.id, 'exclusiveCategories'], action.value);
  case UPDATE_TOKEN_VOTE_INSTRUCTIONS:
    return state.updateIn([action.id, 'instructionsEntries'], updateInLangstringEntries(action.locale, action.value));
  case CREATE_TOKEN_VOTE_CATEGORY:
    return state.updateIn([action.parentId, 'tokenCategories'], tokenCategories => tokenCategories.push(action.id));
  case DELETE_TOKEN_VOTE_CATEGORY:
    return state.updateIn([action.parentId, 'tokenCategories'], tokenCategories =>
      tokenCategories.delete(tokenCategories.size - 1)
    );
  default:
    return state;
  }
};

const initialTokenCategory = Map({
  id: '',
  titleEntries: List(),
  totalNumber: 0,
  color: ''
});

export const tokenCategoriesById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_MODULES: {
    let newState = Map();
    action.voteModules.forEach((m) => {
      if (m.type === 'tokens') {
        m.tokenCategories.forEach((t) => {
          const tokenCategoryInfo = Map({
            id: t.id,
            titleEntries: fromJS(t.titleEntries),
            color: t.color,
            totalNumber: t.totalNumber
          });
          newState = newState.set(t.id, tokenCategoryInfo);
        });
      }
    });
    return newState;
  }
  case CREATE_TOKEN_VOTE_CATEGORY:
    return state.set(action.id, initialTokenCategory.set('id', action.id));
  case UPDATE_TOKEN_VOTE_CATEGORY_TITLE:
    return state.updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  case UPDATE_TOKEN_VOTE_CATEGORY_COLOR:
    return state.setIn([action.id, 'color'], action.value);
  case UPDATE_TOKEN_TOTAL_NUMBER:
    return state.setIn([action.id, 'totalNumber'], action.value);
  default:
    return state;
  }
};

export const voteProposalsHaveChanged = (state: boolean = false, action: ReduxAction<Action>) => {
  switch (action.type) {
  case CREATE_VOTE_PROPOSAL:
  case DELETE_VOTE_PROPOSAL:
  case UPDATE_VOTE_PROPOSAL_TITLE:
  case UPDATE_VOTE_PROPOSAL_DESCRIPTION:
    return true;
  case UPDATE_VOTE_PROPOSALS:
    return false;
  default:
    return state;
  }
};

export const voteProposalsInOrder = (state: List<number> = List(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_PROPOSALS:
    return List(Object.keys(action.voteProposals).map(key => action.voteProposals[key].id || null));
  case CREATE_VOTE_PROPOSAL:
    return state.push(action.id);
  default:
    return state;
  }
};

const defaultVoteProposition = Map({
  isNew: true,
  toDelete: false,
  id: '',
  titleEntries: List(),
  descriptionEntries: List()
});

export const voteProposalsById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_PROPOSALS: {
    let newState = Map();
    action.voteProposals.forEach((proposal) => {
      const proposalInfo = fromJS({
        isNew: false,
        toDelete: false,
        id: proposal.id,
        titleEntries: proposal.titleEntries,
        descriptionEntries: proposal.descriptionEntries
      });
      newState = newState.set(proposal.id, proposalInfo);
    });
    return newState;
  }
  case CREATE_VOTE_PROPOSAL:
    return state.set(action.id, defaultVoteProposition.set('id', action.id));
  case DELETE_VOTE_PROPOSAL:
    return state.setIn([action.id, 'toDelete'], true);
  case UPDATE_VOTE_PROPOSAL_TITLE:
    return state.updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  case UPDATE_VOTE_PROPOSAL_DESCRIPTION:
    return state.updateIn([action.id, 'descriptionEntries'], updateInLangstringEntries(action.locale, action.value));
  default:
    return state;
  }
};

export default combineReducers({
  page: voteSessionPage,
  modulesInOrder: modulesInOrder,
  modulesById: modulesById,
  tokenCategoriesById: tokenCategoriesById,
  modulesHaveChanged: modulesHaveChanged,
  voteProposalsInOrder: voteProposalsInOrder,
  voteProposalsById: voteProposalsById,
  voteProposalsHaveChanged: voteProposalsHaveChanged
});