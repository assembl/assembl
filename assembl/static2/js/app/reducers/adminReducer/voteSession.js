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
  UPDATE_VOTE_PROPOSALS,
  CREATE_VOTE_PROPOSAL,
  DELETE_VOTE_PROPOSAL,
  UPDATE_VOTE_PROPOSAL_TITLE,
  UPDATE_VOTE_PROPOSAL_DESCRIPTION,
  MOVE_PROPOSAL_UP,
  MOVE_PROPOSAL_DOWN,
  UPDATE_GAUGE_VOTE_INSTRUCTIONS,
  UPDATE_GAUGE_VOTE_NUMBER_TICKS,
  UPDATE_GAUGE_VOTE_IS_NUMBER,
  CREATE_GAUGE_VOTE_CHOICE,
  DELETE_GAUGE_VOTE_CHOICE,
  UPDATE_GAUGE_VOTE_CHOICE_LABEL,
  UPDATE_GAUGE_MINIMUM,
  UPDATE_GAUGE_MAXIMUM,
  UPDATE_GAUGE_UNIT,
  ADD_MODULE_TO_PROPOSAL,
  DELETE_MODULE_FROM_PROPOSAL,
  UNDELETE_MODULE
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

export const tokenModulesHaveChanged = (state: boolean = false, action: ReduxAction<Action>) => {
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

export const textGaugeModulesHaveChanged = (state: boolean = false, action: ReduxAction<Action>) => {
  switch (action.type) {
  case CREATE_GAUGE_VOTE_MODULE:
  case DELETE_GAUGE_VOTE_MODULE:
  case UPDATE_GAUGE_VOTE_INSTRUCTIONS:
  case UPDATE_GAUGE_VOTE_NUMBER_TICKS:
  case UPDATE_GAUGE_VOTE_IS_NUMBER:
  case CREATE_GAUGE_VOTE_CHOICE:
  case DELETE_GAUGE_VOTE_CHOICE:
  case UPDATE_GAUGE_VOTE_CHOICE_LABEL:
    return true;
  case UPDATE_VOTE_MODULES:
    return false;
  default:
    return state;
  }
};

export const numberGaugeModulesHaveChanged = (state: boolean = false, action: ReduxAction<Action>) => {
  switch (action.type) {
  case CREATE_GAUGE_VOTE_MODULE:
  case DELETE_GAUGE_VOTE_MODULE:
  case UPDATE_GAUGE_VOTE_INSTRUCTIONS:
  case UPDATE_GAUGE_VOTE_NUMBER_TICKS:
  case UPDATE_GAUGE_VOTE_IS_NUMBER:
  case UPDATE_GAUGE_MINIMUM:
  case UPDATE_GAUGE_MAXIMUM:
  case UPDATE_GAUGE_UNIT:
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
  tokenCategories: List(),
  proposalId: null,
  voteSpecTemplateId: null
});

const defaultTextGaugeChoice = Map({
  id: String,
  labelEntries: List(),
  value: Number
});

const defaultTextGaugeModule = Map({
  isNew: true,
  toDelete: false,
  type: 'gauge',
  instructionsEntries: List(),
  isNumberGauge: false,
  choices: List(),
  proposalId: null,
  voteSpecTemplateId: null
});

const defaultNumberGaugeModule = Map({
  isNew: true,
  toDelete: false,
  type: 'gauge',
  instructionsEntries: List(),
  nbTicks: 1,
  isNumberGauge: true,
  minimum: Number,
  maximum: Number,
  unit: '',
  proposalId: null,
  voteSpecTemplateId: null
});

const getModuleInfo = (m) => {
  if (m.voteType === 'token_vote_specification') {
    return {
      isNew: false,
      toDelete: false,
      type: 'tokens',
      id: m.id,
      instructionsEntries: m.instructionsEntries,
      exclusiveCategories: m.exclusiveCategories,
      tokenCategories: m.tokenCategories.map(t => t.id),
      proposalId: m.proposalId,
      voteSpecTemplateId: m.voteSpecTemplateId
    };
  } else if (m.voteType === 'number_gauge_vote_specification') {
    return {
      isNew: false,
      toDelete: false,
      type: 'gauge',
      id: m.id,
      instructionsEntries: m.instructionsEntries,
      nbTicks: m.nbTicks,
      isNumberGauge: true,
      maximum: m.maximum,
      minimum: m.minimum,
      unit: m.unit,
      proposalId: m.proposalId,
      voteSpecTemplateId: m.voteSpecTemplateId
    };
  } else if (m.voteType === 'gauge_vote_specification') {
    return {
      isNew: false,
      toDelete: false,
      type: 'gauge',
      id: m.id,
      instructionsEntries: m.instructionsEntries,
      nbTicks: m.choices.size,
      isNumberGauge: false,
      choices: m.choices.map(c => c.id),
      proposalId: m.proposalId,
      voteSpecTemplateId: m.voteSpecTemplateId
    };
  }

  return {};
};

export const modulesById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_MODULES: {
    let newState = state;
    action.voteModules.forEach((m) => {
      const moduleInfo = getModuleInfo(m);
      newState = newState.set(m.id, fromJS(moduleInfo));
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
    return state.updateIn([action.id, 'tokenCategories'], tokenCategories => tokenCategories.delete(action.index));
  case CREATE_GAUGE_VOTE_MODULE:
    return state.set(action.id, defaultTextGaugeModule.set('id', action.id));
  case DELETE_GAUGE_VOTE_MODULE:
    return state.setIn([action.id, 'toDelete'], true);
  case UPDATE_GAUGE_VOTE_INSTRUCTIONS:
    return state.updateIn([action.id, 'instructionsEntries'], updateInLangstringEntries(action.locale, action.value));
  case UPDATE_GAUGE_VOTE_IS_NUMBER: {
    if (action.value) {
      return state.set(action.id, defaultNumberGaugeModule.set('id', action.id));
    }
    return state.set(action.id, defaultTextGaugeModule.set('id', action.id));
  }
  case UPDATE_GAUGE_VOTE_NUMBER_TICKS:
    return state.setIn([action.id, 'nbTicks'], action.value);
  case CREATE_GAUGE_VOTE_CHOICE:
    return state.updateIn([action.parentId, 'choices'], choices => choices.push(action.id));
  case DELETE_GAUGE_VOTE_CHOICE:
    return state.updateIn([action.id, 'choices'], choices => choices.delete(action.index));
  case UPDATE_GAUGE_MINIMUM:
    return state.setIn([action.id, 'minimum'], action.value);
  case UPDATE_GAUGE_MAXIMUM:
    return state.setIn([action.id, 'maximum'], action.value);
  case UPDATE_GAUGE_UNIT:
    return state.setIn([action.id, 'unit'], action.value);
  case UPDATE_VOTE_PROPOSALS: {
    let newState = state;
    action.voteProposals.forEach((proposal) => {
      proposal.modules.forEach((pModule) => {
        const moduleInfo = {
          ...getModuleInfo(pModule),
          proposalId: proposal.id
        };
        newState = newState.set(pModule.id, fromJS(moduleInfo));
      });
    });
    return newState;
  }
  case ADD_MODULE_TO_PROPOSAL:
    return state.set(
      action.id,
      fromJS({
        ...action.moduleInfo,
        id: action.id,
        proposalId: action.proposalId,
        isNew: true,
        toDelete: false,
        voteSpecTemplateId: action.moduleTemplateId
      })
    );
  case DELETE_MODULE_FROM_PROPOSAL:
    return state.setIn([action.moduleId, 'toDelete'], true);
  case UNDELETE_MODULE:
    return state.setIn([action.id, 'toDelete'], false);
  default:
    return state;
  }
};

const defaultTokenCategory = Map({
  id: '',
  titleEntries: List(),
  totalNumber: 0,
  color: ''
});

const getTokenCategories = (m) => {
  if (m.voteType === 'token_vote_specification') {
    return m.tokenCategories.map(t =>
      Map({
        id: t.id,
        titleEntries: fromJS(t.titleEntries),
        color: t.color,
        totalNumber: t.totalNumber
      })
    );
  }

  return [];
};

export const tokenCategoriesById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_MODULES: {
    let newState = Map();
    action.voteModules.forEach((m) => {
      getTokenCategories(m).forEach((tc) => {
        newState = newState.set(tc.get('id'), tc);
      });
    });

    return newState;
  }
  case UPDATE_VOTE_PROPOSALS: {
    let newState = state;
    action.voteProposals.forEach((proposal) => {
      proposal.modules.forEach((m) => {
        getTokenCategories(m).forEach((tc) => {
          newState = newState.set(tc.get('id'), tc);
        });
      });
    });

    return newState;
  }
  case CREATE_TOKEN_VOTE_CATEGORY:
    return state.set(action.id, defaultTokenCategory.set('id', action.id));
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
  case ADD_MODULE_TO_PROPOSAL:
  case DELETE_MODULE_FROM_PROPOSAL:
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
  case MOVE_PROPOSAL_UP: {
    const idx = state.indexOf(action.id);
    return state.delete(idx).insert(idx - 1, action.id);
  }
  case MOVE_PROPOSAL_DOWN: {
    const idx = state.indexOf(action.id);
    return state.delete(idx).insert(idx + 1, action.id);
  }
  default:
    return state;
  }
};

const defaultVoteProposal = Map({
  isNew: true,
  toDelete: false,
  id: '',
  titleEntries: List(),
  descriptionEntries: List(),
  modules: List()
});

export const voteProposalsById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_PROPOSALS: {
    let newState = Map();
    action.voteProposals.forEach((proposal) => {
      const proposalInfo = fromJS({
        isNew: false,
        order: proposal.order,
        toDelete: false,
        id: proposal.id,
        titleEntries: proposal.titleEntries,
        descriptionEntries: proposal.descriptionEntries,
        modules: proposal.modules ? proposal.modules.map(m => m.id) : []
      });
      newState = newState.set(proposal.id, proposalInfo);
    });
    return newState;
  }
  case CREATE_VOTE_PROPOSAL:
    return state.set(action.id, defaultVoteProposal.set('id', action.id));
  case DELETE_VOTE_PROPOSAL:
    return state.setIn([action.id, 'toDelete'], true);
  case UPDATE_VOTE_PROPOSAL_TITLE:
    return state.updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  case UPDATE_VOTE_PROPOSAL_DESCRIPTION:
    return state.updateIn([action.id, 'descriptionEntries'], updateInLangstringEntries(action.locale, fromJS(action.value)));
  case ADD_MODULE_TO_PROPOSAL:
    return state.updateIn([action.proposalId, 'modules'], modules => modules.push(action.id));
  default:
    return state;
  }
};

const getGaugeChoices = (m) => {
  if (m.voteType === 'gauge_vote_specification') {
    return m.choices.map(c =>
      Map({
        id: c.id,
        labelEntries: fromJS(c.labelEntries),
        value: c.value
      })
    );
  }

  return [];
};

export const gaugeChoicesById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_VOTE_MODULES: {
    let newState = Map();
    action.voteModules.forEach((m) => {
      getGaugeChoices(m).forEach((gc) => {
        newState = newState.set(gc.get('id'), gc);
      });
    });
    return newState;
  }

  case UPDATE_VOTE_PROPOSALS: {
    let newState = state;
    action.voteProposals.forEach((proposal) => {
      proposal.modules.forEach((m) => {
        getGaugeChoices(m).forEach((gc) => {
          newState = newState.set(gc.get('id'), gc);
        });
      });
    });

    return newState;
  }
  case CREATE_GAUGE_VOTE_CHOICE:
    return state.set(action.id, defaultTextGaugeChoice.set('id', action.id));
  case UPDATE_GAUGE_VOTE_CHOICE_LABEL:
    return state.updateIn([action.id, 'labelEntries'], updateInLangstringEntries(action.locale, action.value));
  default:
    return state;
  }
};

export default combineReducers({
  page: voteSessionPage,
  modulesInOrder: modulesInOrder,
  modulesById: modulesById,
  tokenCategoriesById: tokenCategoriesById,
  voteProposalsInOrder: voteProposalsInOrder,
  voteProposalsById: voteProposalsById,
  voteProposalsHaveChanged: voteProposalsHaveChanged,
  gaugeChoicesById: gaugeChoicesById,
  tokenModulesHaveChanged: tokenModulesHaveChanged,
  textGaugeModulesHaveChanged: textGaugeModulesHaveChanged,
  numberGaugeModulesHaveChanged: numberGaugeModulesHaveChanged
});