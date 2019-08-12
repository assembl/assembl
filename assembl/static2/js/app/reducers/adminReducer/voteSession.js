// @flow
import pick from 'lodash/pick';
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';
import * as actionTypes from '../../actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';
import { pickerColors } from '../../constants';
import { moveItemUp, moveItemDown } from '../../utils/globalFunctions';

const initialPage = Map({
  _hasChanged: false,
  id: '',
  seeCurrentVotes: false,
  propositionsSectionTitleEntries: List(),
  headerImage: Map({
    externalUrl: '',
    mimeType: '',
    title: ''
  })
});

export const voteSessionPage = (state: Map = initialPage, action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.UPDATE_VOTE_SESSION_PAGE_PROPOSITIONS_TITLE:
    return state
      .update('propositionsSectionTitleEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('_hasChanged', true);
  case actionTypes.UPDATE_VOTE_SESSION_PAGE_SEECURRENTVOTES:
    return state.set('seeCurrentVotes', action.value).set('_hasChanged', true);
  case actionTypes.UPDATE_VOTE_SESSION_PAGE: {
    return Map({
      _hasChanged: false,
      id: fromJS(action.id),
      seeCurrentVotes: action.seeCurrentVotes,
      propositionsSectionTitleEntries: fromJS(action.propositionsSectionTitleEntries)
    });
  }
  default:
    return state;
  }
};

export const modulesOrProposalsHaveChanged = (state: boolean = false, action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.ADD_MODULE_TO_PROPOSAL:
  case actionTypes.CANCEL_MODULE_CUSTOMIZATION:
  case actionTypes.CREATE_GAUGE_VOTE_CHOICE:
  case actionTypes.CREATE_GAUGE_VOTE_MODULE:
  case actionTypes.CREATE_TOKEN_VOTE_CATEGORY:
  case actionTypes.CREATE_TOKEN_VOTE_MODULE:
  case actionTypes.CREATE_VOTE_PROPOSAL:
  case actionTypes.UPDATE_VOTE_MODULE:
  case actionTypes.DELETE_GAUGE_VOTE_CHOICE:
  case actionTypes.DELETE_TOKEN_VOTE_CATEGORY:
  case actionTypes.DELETE_VOTE_MODULE:
  case actionTypes.DELETE_VOTE_PROPOSAL:
  case actionTypes.MARK_ALL_DEPENDENCIES_AS_CHANGED:
  case actionTypes.MOVE_PROPOSAL_DOWN:
  case actionTypes.MOVE_PROPOSAL_UP:
  case actionTypes.UPDATE_GAUGE_MAXIMUM:
  case actionTypes.UPDATE_GAUGE_MINIMUM:
  case actionTypes.UPDATE_GAUGE_UNIT:
  case actionTypes.UPDATE_GAUGE_VOTE_CHOICE_LABEL:
  case actionTypes.UPDATE_GAUGE_VOTE_INSTRUCTIONS:
  case actionTypes.UPDATE_GAUGE_VOTE_IS_NUMBER:
  case actionTypes.UPDATE_GAUGE_VOTE_NUMBER_TICKS:
  case actionTypes.UPDATE_TOKEN_TOTAL_NUMBER:
  case actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_COLOR:
  case actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_TITLE:
  case actionTypes.UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY:
  case actionTypes.UPDATE_TOKEN_VOTE_INSTRUCTIONS:
  case actionTypes.UPDATE_VOTE_PROPOSAL_DESCRIPTION:
  case actionTypes.UPDATE_VOTE_PROPOSAL_TITLE:
    return true;
  case actionTypes.UPDATE_VOTE_MODULES:
  case actionTypes.UPDATE_VOTE_PROPOSALS:
    return false;
  default:
    return state;
  }
};

export const modulesInOrder = (state: List<number> = List(), action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.UPDATE_VOTE_MODULES:
    return List(Object.keys(action.voteModules).map(key => action.voteModules[key].id || null));
  case actionTypes.CREATE_TOKEN_VOTE_MODULE:
    return state.push(action.id);
  case actionTypes.CREATE_GAUGE_VOTE_MODULE:
    return state.push(action.id);
  default:
    return state;
  }
};

const defaultTokenModule = Map({
  _hasChanged: false,
  isCustom: false,
  _isNew: true,
  _toDelete: false,
  type: 'tokens',
  instructionsEntries: List(),
  exclusiveCategories: true,
  tokenCategories: List(),
  proposalId: null,
  voteSpecTemplateId: null
});

const defaultTextGaugeChoice = Map({
  id: String,
  labelEntries: List()
  // value: Number
});

const defaultTextGaugeModule = Map({
  _hasChanged: false,
  isCustom: false,
  _isNew: true,
  _toDelete: false,
  type: 'gauge',
  instructionsEntries: List(),
  isNumberGauge: false,
  choices: List(),
  proposalId: null,
  voteSpecTemplateId: null
});

const defaultNumberGaugeModule = Map({
  _hasChanged: false,
  isCustom: false,
  _isNew: true,
  _toDelete: false,
  type: 'gauge',
  instructionsEntries: List(),
  nbTicks: 2,
  isNumberGauge: true,
  minimum: 0,
  maximum: 10,
  unit: '',
  proposalId: null,
  voteSpecTemplateId: null
});

const getModuleInfo = (m) => {
  const typeMapping = {
    token_vote_specification: 'tokens',
    number_gauge_vote_specification: 'gauge',
    gauge_vote_specification: 'gauge'
  };
  const moduleInfo = {
    _hasChanged: false,
    _isNew: false,
    _toDelete: false,
    id: m.id,
    instructionsEntries: m.instructionsEntries,
    isCustom: m.isCustom,
    proposalId: m.proposalId,
    type: typeMapping[m.voteType],
    voteSpecTemplateId: m.voteSpecTemplateId
  };

  let customModuleInfo = {};
  if (m.voteSpecTemplateId === null || m.isCustom) {
    if (m.voteType === 'token_vote_specification') {
      customModuleInfo = {
        exclusiveCategories: m.exclusiveCategories,
        tokenCategories: m.tokenCategories.map(t => t.id)
      };
    } else if (m.voteType === 'number_gauge_vote_specification') {
      customModuleInfo = {
        nbTicks: m.nbTicks,
        isNumberGauge: true,
        maximum: m.maximum,
        minimum: m.minimum,
        unit: m.unit
      };
    } else if (m.voteType === 'gauge_vote_specification') {
      customModuleInfo = {
        nbTicks: m.choices.size,
        isNumberGauge: false,
        choices: m.choices.map(c => c.id)
      };
    }
  }

  return {
    ...customModuleInfo,
    ...moduleInfo
  };
};

const specificKeys = ['choices', 'maximum', 'minimum', 'nbTicks', 'unit'];
type SpecificInfo = {
  maximum?: Number,
  minimum?: Number,
  nbTicks?: Number,
  unit?: string,
  choices?: List<string>
};
const updateGaugeSpecificInfo = (info: SpecificInfo) => (m: Map<string, any>) => {
  if (m.get('isNumberGauge')) {
    const { maximum, minimum, nbTicks, unit } = info;
    return m
      .delete('choices')
      .set('maximum', maximum)
      .set('minimum', minimum)
      .set('nbTicks', nbTicks)
      .set('unit', unit);
  }

  return m
    .set('choices', info.choices)
    .delete('maximum')
    .delete('minimum')
    .delete('nbTicks')
    .delete('unit');
};

export const modulesById = (state: Map<string, Map> = Map(), action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.UPDATE_VOTE_MODULES: {
    let newState = state;
    action.voteModules.forEach((m) => {
      const moduleInfo = getModuleInfo(m);
      newState = newState.set(m.id, fromJS(moduleInfo));
    });
    return newState;
  }
  case actionTypes.DELETE_VOTE_MODULE:
    return state.setIn([action.id, '_toDelete'], true);
  case actionTypes.CREATE_TOKEN_VOTE_MODULE:
    return state.set(action.id, defaultTokenModule.set('id', action.id));
  case actionTypes.UPDATE_TOKEN_VOTE_EXCLUSIVE_CATEGORY:
    return state.setIn([action.id, 'exclusiveCategories'], action.value).setIn([action.id, '_hasChanged'], true);
  case actionTypes.UPDATE_TOKEN_VOTE_INSTRUCTIONS:
    return state
      .updateIn([action.id, 'instructionsEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case actionTypes.CREATE_TOKEN_VOTE_CATEGORY:
    return state
      .updateIn([action.moduleId, 'tokenCategories'], tokenCategories => tokenCategories.push(action.id))
      .setIn([action.moduleId, '_hasChanged'], true);
  case actionTypes.DELETE_TOKEN_VOTE_CATEGORY:
    return state
      .updateIn([action.moduleId, 'tokenCategories'], tokenCategories => tokenCategories.delete(action.index))
      .setIn([action.moduleId, '_hasChanged'], true);
  case actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_TITLE:
  case actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_COLOR:
  case actionTypes.UPDATE_TOKEN_TOTAL_NUMBER:
    return state.setIn([action.moduleId, '_hasChanged'], true);
  case actionTypes.CREATE_GAUGE_VOTE_MODULE:
    return state.set(action.id, defaultTextGaugeModule.set('id', action.id));
  case actionTypes.UPDATE_GAUGE_VOTE_INSTRUCTIONS:
    return state
      .updateIn([action.id, 'instructionsEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case actionTypes.UPDATE_GAUGE_VOTE_IS_NUMBER: {
    if (action.value) {
      return state.set(action.id, defaultNumberGaugeModule.set('id', action.id)).setIn([action.id, '_hasChanged'], true);
    }
    return state.set(action.id, defaultTextGaugeModule.set('id', action.id)).setIn([action.id, '_hasChanged'], true);
  }
  case actionTypes.UPDATE_GAUGE_VOTE_NUMBER_TICKS:
    return state.setIn([action.id, 'nbTicks'], action.value).setIn([action.id, '_hasChanged'], true);
  case actionTypes.CREATE_GAUGE_VOTE_CHOICE:
    return state
      .updateIn([action.moduleId, 'choices'], choices => choices.push(action.id))
      .setIn([action.moduleId, '_hasChanged'], true);
  case actionTypes.DELETE_GAUGE_VOTE_CHOICE:
    return state
      .updateIn([action.moduleId, 'choices'], choices => choices.delete(action.index))
      .setIn([action.moduleId, '_hasChanged'], true);
  case actionTypes.UPDATE_GAUGE_VOTE_CHOICE_LABEL:
    return state.setIn([action.moduleId, '_hasChanged'], true);
  case actionTypes.UPDATE_GAUGE_MINIMUM:
    return state.setIn([action.id, 'minimum'], action.value).setIn([action.id, '_hasChanged'], true);
  case actionTypes.UPDATE_GAUGE_MAXIMUM:
    return state.setIn([action.id, 'maximum'], action.value).setIn([action.id, '_hasChanged'], true);
  case actionTypes.UPDATE_GAUGE_UNIT:
    return state.setIn([action.id, 'unit'], action.value).setIn([action.id, '_hasChanged'], true);
  case actionTypes.UPDATE_VOTE_PROPOSALS: {
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
  case actionTypes.ADD_MODULE_TO_PROPOSAL:
    return state.set(
      action.id,
      fromJS({
        id: action.id,
        isCustom: false,
        proposalId: action.proposalId,
        _isNew: true,
        _toDelete: false,
        _hasChanged: false,
        voteSpecTemplateId: action.voteSpecTemplateId
      })
    );
  case actionTypes.UNDELETE_MODULE:
    return state.setIn([action.id, '_toDelete'], false);
  case actionTypes.MARK_ALL_DEPENDENCIES_AS_CHANGED:
    return state.map((voteSpec) => {
      if (voteSpec.get('voteSpecTemplateId') === action.id && !voteSpec.get('isCustom')) {
        return voteSpec.set('_hasChanged', true);
      }

      return voteSpec;
    });
  case actionTypes.CANCEL_MODULE_CUSTOMIZATION: {
    const template = state.get(state.getIn([action.id, 'voteSpecTemplateId']));
    const specificInfo = template.filter((v, k) => specificKeys.includes(k)).toJS();
    return state
      .update(action.id, m => m.set('isNumberGauge', template.get('isNumberGauge')))
      .update(action.id, m => m.set('isCustom', false).set('_hasChanged', true))
      .update(action.id, updateGaugeSpecificInfo(specificInfo))
      .setIn([action.id, 'instructionsEntries'], template.get('instructionsEntries'))
      .deleteIn([action.id, 'choices']);
  }
  case actionTypes.UPDATE_VOTE_MODULE: {
    const { instructions, isCustom, isNumberGauge, type } = action.info;
    let specificInfo = pick(action.info, specificKeys);
    specificInfo = {
      ...specificInfo,
      choices: specificInfo.choices && specificInfo.choices.map(c => c.get('id'))
    };
    return state
      .update(action.id, m =>
        m
          .set('isNumberGauge', isNumberGauge)
          .set('isCustom', isCustom)
          .set('type', type)
          .set('_hasChanged', true)
          .update('instructionsEntries', updateInLangstringEntries(action.locale, instructions))
      )
      .update(action.id, updateGaugeSpecificInfo(specificInfo));
  }
  default:
    return state;
  }
};

const defaultTokenCategory = Map({
  id: '',
  titleEntries: List(),
  totalNumber: 1,
  color: '#B8E986'
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

export const tokenCategoriesById = (state: Map<string, Map> = Map(), action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.UPDATE_VOTE_MODULES: {
    let newState = Map();
    action.voteModules.forEach((m) => {
      getTokenCategories(m).forEach((tc) => {
        newState = newState.set(tc.get('id'), tc);
      });
    });

    return newState;
  }
  case actionTypes.UPDATE_VOTE_PROPOSALS: {
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
  case actionTypes.CREATE_TOKEN_VOTE_CATEGORY: {
    const randomColor = pickerColors[Math.floor(Math.random() * Math.floor(pickerColors.length))];
    return state.set(action.id, defaultTokenCategory.set('id', action.id).set('color', randomColor));
  }
  case actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_TITLE:
    return state.updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  case actionTypes.UPDATE_TOKEN_VOTE_CATEGORY_COLOR:
    return state.setIn([action.id, 'color'], action.value);
  case actionTypes.UPDATE_TOKEN_TOTAL_NUMBER:
    return state.setIn([action.id, 'totalNumber'], action.value);
  default:
    return state;
  }
};

const defaultVoteProposal = Map({
  _isNew: true,
  _toDelete: false,
  _hasChanged: false,
  _validationErrors: [],
  id: '',
  titleEntries: List(),
  descriptionEntries: List(),
  modules: List()
});

export const voteProposalsById = (state: Map<string, Map> = Map(), action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.UPDATE_VOTE_PROPOSALS: {
    let newState = Map();
    action.voteProposals.forEach((proposal) => {
      const proposalInfo = Map({
        _isNew: false,
        _toDelete: false,
        _hasChanged: false,
        _validationErrors: List(),
        order: proposal.order,
        id: proposal.id,
        titleEntries: fromJS(proposal.titleEntries),
        descriptionEntries: List(proposal.descriptionEntries.map(entry => Map(entry))),
        modules: fromJS(proposal.modules ? proposal.modules.map(m => m.id) : [])
      });
      newState = newState.set(proposal.id, proposalInfo);
    });
    return newState;
  }
  case actionTypes.CREATE_VOTE_PROPOSAL: {
    const order =
        state
          .filter(item => !item.get('_toDelete'))
          .map(v => v.get('order'))
          .max() + 1.0;
    return state.set(action.id, defaultVoteProposal.set('id', action.id).set('order', order));
  }
  case actionTypes.DELETE_VOTE_PROPOSAL:
    return state.setIn([action.id, '_toDelete'], true);
  case actionTypes.MOVE_PROPOSAL_UP:
    return moveItemUp(state, action.id);
  case actionTypes.MOVE_PROPOSAL_DOWN:
    return moveItemDown(state, action.id);
  case actionTypes.UPDATE_VOTE_PROPOSAL_TITLE:
    return state
      .updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case actionTypes.UPDATE_VOTE_PROPOSAL_DESCRIPTION:
    return state
      .updateIn([action.id, 'descriptionEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case actionTypes.ADD_MODULE_TO_PROPOSAL:
    return state.updateIn([action.proposalId, 'modules'], modules => modules.push(action.id));
  case actionTypes.SET_VALIDATION_ERRORS:
    return state.setIn([action.id, '_validationErrors'], action.errors);
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

export const gaugeChoicesById = (state: Map<string, Map> = Map(), action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.UPDATE_VOTE_MODULE: {
    if (action.info.choices) {
      let newState = state;
      action.info.choices.forEach((choice) => {
        const cid = choice.get('id');
        if (state.has(cid)) {
          newState = newState.updateIn([cid, 'labelEntries'], updateInLangstringEntries(action.locale, choice.get('title')));
        } else {
          newState = newState.set(
            cid,
            defaultTextGaugeChoice
              .set('id', cid)
              .update('labelEntries', updateInLangstringEntries(action.locale, choice.get('title')))
          );
        }
      });

      return newState;
    }

    return state;
  }
  case actionTypes.UPDATE_VOTE_MODULES: {
    let newState = Map();
    action.voteModules.forEach((m) => {
      getGaugeChoices(m).forEach((gc) => {
        newState = newState.set(gc.get('id'), gc);
      });
    });
    return newState;
  }

  case actionTypes.UPDATE_VOTE_PROPOSALS: {
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
  case actionTypes.CREATE_GAUGE_VOTE_CHOICE:
    return state.set(action.id, defaultTextGaugeChoice.set('id', action.id));
  case actionTypes.UPDATE_GAUGE_VOTE_CHOICE_LABEL:
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
  voteProposalsById: voteProposalsById,
  gaugeChoicesById: gaugeChoicesById,
  modulesOrProposalsHaveChanged: modulesOrProposalsHaveChanged
});