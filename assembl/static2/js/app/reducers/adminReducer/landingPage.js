// @flow
import { fromJS, List, Map } from 'immutable';
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';

import {
  type Action,
  MOVE_LANDING_PAGE_MODULE_DOWN,
  MOVE_LANDING_PAGE_MODULE_UP,
  TOGGLE_LANDING_PAGE_MODULE,
  UPDATE_LANDING_PAGE_MODULES
} from '../../actions/actionTypes';

type ModulesHasChangedReducer = (boolean, ReduxAction<Action>) => boolean;
export const modulesHasChanged: ModulesHasChangedReducer = (state = false, action) => {
  switch (action.type) {
  case TOGGLE_LANDING_PAGE_MODULE:
    return true;
  case UPDATE_LANDING_PAGE_MODULES:
    return false;
  default:
    return state;
  }
};

type EnabledModulesInOrderReducer = (List<string>, ReduxAction<Action>) => List<string>;
export const enabledModulesInOrder: EnabledModulesInOrderReducer = (state = List(), action) => {
  switch (action.type) {
  case MOVE_LANDING_PAGE_MODULE_UP: {
    const idx = state.indexOf(action.moduleTypeIdentifier);
    if (idx === 1) {
      return state;
    }
    return state.delete(idx).insert(idx - 1, action.moduleTypeIdentifier);
  }
  case MOVE_LANDING_PAGE_MODULE_DOWN: {
    const idx = state.indexOf(action.moduleTypeIdentifier);
    if (idx === state.size - 2) {
      return state;
    }

    return state.delete(idx).insert(idx + 1, action.moduleTypeIdentifier);
  }
  case TOGGLE_LANDING_PAGE_MODULE: {
    const identifier = action.moduleTypeIdentifier;
    const idx = state.indexOf(identifier);
    if (idx !== -1) {
      return state.delete(idx);
    }

    // insert at the end (just before FOOTER module)
    return state.insert(state.size - 1, identifier);
  }
  case UPDATE_LANDING_PAGE_MODULES:
    return List(action.modules.filter(module => module.enabled).map(module => module.moduleType.identifier));
  default:
    return state;
  }
};

const initialState = Map();
type ModulesByIdentifierReducer = (Map<string, Map>, ReduxAction<Action>) => Map<string, Map>;
export const modulesByIdentifier: ModulesByIdentifierReducer = (state = initialState, action) => {
  switch (action.type) {
  case TOGGLE_LANDING_PAGE_MODULE: {
    const moduleType = action.moduleTypeIdentifier;
    return state.updateIn([moduleType, 'enabled'], v => !v);
  }
  case UPDATE_LANDING_PAGE_MODULES: {
    let newState = Map();
    action.modules.forEach((module) => {
      newState = newState.set(module.moduleType.identifier, fromJS(module));
    });
    return newState;
  }
  default:
    return state;
  }
};

export type LandingPageReducer = {
  enabledModulesInOrder: EnabledModulesInOrderReducer,
  modulesHasChanged: ModulesHasChangedReducer,
  modulesByIdentifier: ModulesByIdentifierReducer
};
const reducers: LandingPageReducer = {
  enabledModulesInOrder: enabledModulesInOrder,
  modulesHasChanged: modulesHasChanged,
  modulesByIdentifier: modulesByIdentifier
};
export default combineReducers(reducers);