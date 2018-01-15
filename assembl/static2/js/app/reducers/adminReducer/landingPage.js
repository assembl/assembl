// @flow
import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';

import { type Action, TOGGLE_LANDING_PAGE_MODULE, UPDATE_LANDING_PAGE_MODULES } from '../../actions/actionTypes';

const initialState = Map();
type ModulesReducer = (Map<string, Map>, ReduxAction<Action>) => Map<string, Map>;
export const modules: ModulesReducer = (state = initialState, action) => {
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
  modules: ModulesReducer
};
const reducers: LandingPageReducer = {
  modules: modules
};
export default combineReducers(reducers);