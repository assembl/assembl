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
  CREATE_GAUGE_VOTE_MODULE,
  DELETE_GAUGE_VOTE_MODULE,
  UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY,
  UPDATE_TOKEN_VOTE_INSTRUCTIONS,
  CREATE_TOKEN_VOTE_CATEGORY,
  DELETE_TOKEN_VOTE_CATEGORY,
  UPDATE_TOKEN_VOTE_CATEGORY_TITLE,
  UPDATE_TOKEN_TOTAL_NUMBER,
  UPDATE_TOKEN_VOTE_CATEGORY_COLOR,
  UPDATE_GAUGE_VOTE_INSTRUCTIONS,
  UPDATE_GAUGE_VOTE_NUMBER_TICKS,
  UPDATE_GAUGE_VOTE_IS_NUMBER
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
  case CREATE_GAUGE_VOTE_MODULE:
  case DELETE_GAUGE_VOTE_MODULE:
  case UPDATE_GAUGE_VOTE_INSTRUCTIONS:
  case UPDATE_GAUGE_VOTE_NUMBER_TICKS:
  case UPDATE_GAUGE_VOTE_IS_NUMBER:
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
  case CREATE_GAUGE_VOTE_MODULE:
    return state.push(action.id);
  default:
    return state;
  }
};

const defaultTokenModule = Map({
  isNew: true,
  toDelete: false,
  type: 'tokens',
  instructionsEntries: List(),
  exclusiveCategories: false,
  tokenCategories: List()
});

const defaultGaugeModule = Map({
  isNew: true,
  toDelete: false,
  type: 'gauge',
  instructionsEntries: List(),
  nbTicks: 1,
  isNumberGauge: false
});

// const defaultNumberGaugeModule = Map({
//   maximum: Number,
//   minimum: Number,
//   nbTicks: Number,
//   unit: ''
// });

// const defaultTextGaugeModule = Map({
//   choices: Map({
//     id: '',
//     labelEntries: List(),
//     value: Number
//   })
// });

export const modulesById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_MODULES: {
    let newState = Map();
    action.voteModules.forEach((m) => {
        const type = m.__typename; // eslint-disable-line
      if (type === 'TokenVoteSpecification') {
        const moduleInfo = fromJS({
          isNew: false,
          toDelete: false,
          type: 'tokens',
          id: m.id,
          instructionsEntries: m.instructionsEntries,
          exclusiveCategories: m.exclusiveCategories,
          tokenCategories: m.tokenCategories.map(t => t.id)
        });
        newState = newState.set(m.id, moduleInfo);
      } else if (type === 'NumberGaugeVoteSpecification') {
        const moduleInfo = fromJS({
          isNew: false,
          toDelete: false,
          type: 'gauge',
          instructionsEntries: m.instructionsEntries,
          nbTicks: m.nbTicks,
          isNumberGauge: true,
          id: m.id,
          maximum: m.maximum,
          minimum: m.minimum,

          unit: m.unit
        });
        newState = newState.set(m.id, moduleInfo);
      } else if (type === 'GaugeVoteSpecification') {
        const moduleInfo = fromJS({
          isNew: false,
          toDelete: false,
          type: 'gauge',
          instructionsEntries: m.instructionsEntries,
          nbTicks: m.choices.size,
          isNumberGauge: false,
          id: m.id,
          choices: m.choices
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
  case CREATE_GAUGE_VOTE_MODULE:
    return state.set(action.id, defaultGaugeModule.set('id', action.id));
  case DELETE_GAUGE_VOTE_MODULE:
    return state.setIn([action.id, 'toDelete'], true);
  case UPDATE_GAUGE_VOTE_INSTRUCTIONS:
    return state.updateIn([action.id, 'instructionsEntries'], updateInLangstringEntries(action.locale, action.value));
  case UPDATE_GAUGE_VOTE_NUMBER_TICKS:
    return state.setIn([action.id, 'nbTicks'], action.value);
  case UPDATE_GAUGE_VOTE_IS_NUMBER:
    return state.setIn([action.id, 'isNumberGauge'], action.value);
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
        const type = m.__typename; // eslint-disable-line
      if (type === 'TokenVoteSpecification') {
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

export default combineReducers({
  page: voteSessionPage,
  modulesInOrder: modulesInOrder,
  modulesById: modulesById,
  tokenCategoriesById: tokenCategoriesById,
  modulesHaveChanged: modulesHaveChanged
});