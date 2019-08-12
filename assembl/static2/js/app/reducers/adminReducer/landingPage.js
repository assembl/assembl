// @flow
import { fromJS, List, Map } from 'immutable';
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import * as actionTypes from '../../actions/actionTypes';

export const modulesHasChanged = (state: boolean = false, action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.CREATE_LANDING_PAGE_MODULE:
  case actionTypes.MOVE_LANDING_PAGE_MODULE_UP:
  case actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN:
  case actionTypes.TOGGLE_LANDING_PAGE_MODULE:
    return true;
  case actionTypes.UPDATE_LANDING_PAGE_MODULES:
    return false;
  default:
    return state;
  }
};

export const modulesInOrder = (state: List<string> = List(), action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.UPDATE_LANDING_PAGE_MODULES:
    return List(action.modules.map(module => module.id));
  case actionTypes.CREATE_LANDING_PAGE_MODULE:
    // insert at the end (just before FOOTER module)
    return state.insert(state.size - 1, action.id);
  default:
    return state;
  }
};

export const enabledModulesInOrder = (state: List<string> = List(), action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.CREATE_LANDING_PAGE_MODULE:
    // insert at the end (just before FOOTER module)
    return state.insert(state.size - 1, action.id);
  case actionTypes.MOVE_LANDING_PAGE_MODULE_UP: {
    const idx = state.indexOf(action.id);
    if (idx === 1) {
      return state;
    }
    return state.delete(idx).insert(idx - 1, action.id);
  }
  case actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN: {
    const idx = state.indexOf(action.id);
    if (idx === state.size - 2) {
      return state;
    }
    return state.delete(idx).insert(idx + 1, action.id);
  }
  case actionTypes.TOGGLE_LANDING_PAGE_MODULE: {
    const id = action.id;
    const idx = state.indexOf(id);
    if (idx !== -1) {
      return state.delete(idx);
    }
    // insert at the end (just before FOOTER module)
    return state.insert(state.size - 1, id);
  }
  case actionTypes.UPDATE_LANDING_PAGE_MODULES:
    return List(action.modules.filter(module => module.enabled).map(module => module.id));
  default:
    return state;
  }
};

const defaultResource = Map({
  _toDelete: false,
  _hasChanged: false,
  enabled: true,
  existsInDatabase: false,
  moduleType: Map({
    editableOrder: true,
    required: false
  })
});

const initialState = Map();
export const modulesById = (state: Map<string, Map> = initialState, action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.CREATE_LANDING_PAGE_MODULE:
    return state.set(
      action.id,
      defaultResource
        .setIn(['moduleType', 'moduleId'], action.id)
        .setIn(['moduleType', 'identifier'], action.identifier)
        .setIn(['moduleType', 'title'], `${action.title} ${action.numberOfDuplicatesModules}`)
        .set('order', action.order)
        .set('id', action.id)
    );
  case actionTypes.TOGGLE_LANDING_PAGE_MODULE: {
    const moduleType = action.id;
    return state.updateIn([moduleType, 'enabled'], v => !v).setIn([moduleType, '_hasChanged'], true);
  }
  case actionTypes.MOVE_LANDING_PAGE_MODULE_UP: {
    let newState = Map();
    state.forEach((module) => {
      const id = module.get('id');
      newState = newState.set(id, fromJS(module)).setIn([id, '_hasChanged'], true);
    });
    return state;
  }
  case actionTypes.MOVE_LANDING_PAGE_MODULE_DOWN: {
    let newState = Map();
    state.forEach((module) => {
      const id = module.get('id');
      newState = newState.set(id, fromJS(module)).setIn([id, '_hasChanged'], true);
    });
    return state;
  }
  case actionTypes.UPDATE_LANDING_PAGE_MODULES: {
    let newState = Map();
    action.modules.forEach((module) => {
      newState = newState.set(module.id, fromJS(module));
    });
    return newState;
  }
  default:
    return state;
  }
};

const reducers = {
  modulesInOrder: modulesInOrder,
  enabledModulesInOrder: enabledModulesInOrder,
  modulesHasChanged: modulesHasChanged,
  modulesById: modulesById
};

export default combineReducers(reducers);