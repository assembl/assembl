// @flow
import { fromJS, List, Map } from 'immutable';
import type ReduxAction from 'redux';
import { combineReducers } from 'redux';
import {
  type Action,
  CREATE_LANDING_PAGE_MODULE,
  MOVE_LANDING_PAGE_MODULE_DOWN,
  MOVE_LANDING_PAGE_MODULE_UP,
  UPDATE_LANDING_PAGE_MODULES,
  RESET_LANDING_PAGE_MODULES
} from '../../actions/actionTypes';
import { getModuleTypeInfo } from '../../components/administration/landingPage/manageModules';

type IsOrderingModulesReducer = (boolean, ReduxAction<Action>) => boolean;
export const isOrderingModules: IsOrderingModulesReducer = (state = false, action) => {
  switch (action.type) {
  case MOVE_LANDING_PAGE_MODULE_UP:
  case MOVE_LANDING_PAGE_MODULE_DOWN:
    return true;
  case RESET_LANDING_PAGE_MODULES:
  case UPDATE_LANDING_PAGE_MODULES:
  case CREATE_LANDING_PAGE_MODULE:
    return false;
  default:
    return state;
  }
};

type ModulesInOrderState = List<string>;
type ModulesInOrderReducer = (ModulesInOrderState, ReduxAction<Action>) => ModulesInOrderState;
export const modulesInOrder: ModulesInOrderReducer = (state = List(), action) => {
  switch (action.type) {
  case UPDATE_LANDING_PAGE_MODULES:
  case RESET_LANDING_PAGE_MODULES:
    return List(
      action.modules
        .filter((module) => {
          const moduleInfo = getModuleTypeInfo(module.moduleType.identifier);
          return moduleInfo && moduleInfo.implemented;
        })
        .map(module => module.id)
    );
  case CREATE_LANDING_PAGE_MODULE:
    // insert at the end (just before FOOTER module)
    return state.insert(state.size - 1, action.id);
  case MOVE_LANDING_PAGE_MODULE_UP: {
    const idx = state.indexOf(action.id);
    if (idx === 1) {
      return state;
    }
    return state.delete(idx).insert(idx - 1, action.id);
  }
  case MOVE_LANDING_PAGE_MODULE_DOWN: {
    const idx = state.indexOf(action.id);
    if (idx === state.size - 2) {
      return state;
    }

    return state.delete(idx).insert(idx + 1, action.id);
  }
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
type ModulesByIdState = Map<string, Map>;
type ModulesByIdReducer = (ModulesByIdState, ReduxAction<Action>) => ModulesByIdState;
export const modulesById: ModulesByIdReducer = (state = initialState, action) => {
  switch (action.type) {
  case CREATE_LANDING_PAGE_MODULE:
    return state.set(
      action.id,
      defaultResource
        .setIn(['moduleType', 'moduleId'], action.id)
        .setIn(['moduleType', 'identifier'], action.identifier)
        .setIn(['moduleType', 'title'], `${action.title} ${action.numberOfDuplicatesModules}`)
        .set('order', action.order)
        .set('id', action.id)
    );
  case MOVE_LANDING_PAGE_MODULE_UP: {
    let newState = Map();
    state.forEach((module) => {
      const id = module.get('id');
      newState = newState.set(id, fromJS(module)).setIn([id, '_hasChanged'], true);
    });
    return state;
  }
  case MOVE_LANDING_PAGE_MODULE_DOWN: {
    let newState = Map();
    state.forEach((module) => {
      const id = module.get('id');
      newState = newState.set(id, fromJS(module)).setIn([id, '_hasChanged'], true);
    });
    return state;
  }
  case UPDATE_LANDING_PAGE_MODULES: {
    let newState = Map();
    action.modules.forEach((module) => {
      newState = newState.set(module.id, fromJS(module));
    });
    return newState;
  }
  case RESET_LANDING_PAGE_MODULES:
  default:
    return state;
  }
};

const reducers = {
  isOrderingModules: isOrderingModules,
  modulesInOrder: modulesInOrder,
  modulesById: modulesById
};

export default combineReducers(reducers);