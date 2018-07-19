// @flow
import { fromJS, List, Map } from 'immutable';
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import { updateInLangstringEntries } from '../../utils/i18n';
import {
  type Action,
  MOVE_LANDING_PAGE_MODULE_DOWN,
  MOVE_LANDING_PAGE_MODULE_UP,
  TOGGLE_LANDING_PAGE_MODULE,
  UPDATE_LANDING_PAGE_MODULES,
  UPDATE_LANDING_PAGE_MODULE_TITLE,
  UPDATE_LANDING_PAGE_MODULE_SUBTITLE,
  UPDATE_LANDING_PAGE,
  UPDATE_LANDING_PAGE_HEADER_TITLE,
  UPDATE_LANDING_PAGE_HEADER_SUBTITLE,
  UPDATE_LANDING_PAGE_HEADER_BUTTON_LABEL,
  UPDATE_LANDING_PAGE_HEADER_IMAGE,
  UPDATE_LANDING_PAGE_HEADER_LOGO
} from '../../actions/actionTypes';

type ModulesHasChangedReducer = (boolean, ReduxAction<Action>) => boolean;
export const modulesHasChanged: ModulesHasChangedReducer = (state = false, action) => {
  switch (action.type) {
  case MOVE_LANDING_PAGE_MODULE_UP:
  case MOVE_LANDING_PAGE_MODULE_DOWN:
  case UPDATE_LANDING_PAGE_MODULE_TITLE:
  case UPDATE_LANDING_PAGE_MODULE_SUBTITLE:
  case TOGGLE_LANDING_PAGE_MODULE:
    return true;
  case UPDATE_LANDING_PAGE_MODULES:
    return false;
  default:
    return state;
  }
};

type EnabledModulesInOrderState = List<string>;
type EnabledModulesInOrderReducer = (EnabledModulesInOrderState, ReduxAction<Action>) => EnabledModulesInOrderState;
export const enabledModulesInOrder: EnabledModulesInOrderReducer = (state = List(), action) => {
  switch (action.type) {
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
  case TOGGLE_LANDING_PAGE_MODULE: {
    const id = action.id;
    const idx = state.indexOf(id);
    if (idx !== -1) {
      return state.delete(idx);
    }

    // insert at the end (just before FOOTER module)
    return state.insert(state.size - 1, id);
  }
  case UPDATE_LANDING_PAGE_MODULES:
    return List(action.modules.filter(module => module.enabled).map(module => module.moduleType.id));
  default:
    return state;
  }
};

const initialState = Map();
type ModulesByIdState = Map<string, Map>;
type ModulesByIdReducer = (ModulesByIdState, ReduxAction<Action>) => ModulesByIdState;
export const modulesById: ModulesByIdReducer = (state = initialState, action) => {
  switch (action.type) {
  case TOGGLE_LANDING_PAGE_MODULE: {
    const moduleType = action.id;
    return state.updateIn([moduleType, 'enabled'], v => !v).setIn([moduleType, '_hasChanged'], true);
  }
  case MOVE_LANDING_PAGE_MODULE_UP: {
    let newState = Map();
    state.forEach((module) => {
      const id = module.getIn(['moduleType', 'id']);
      newState = newState.set(id, fromJS(module)).setIn([id, '_hasChanged'], true);
    });
    return state;
  }
  case MOVE_LANDING_PAGE_MODULE_DOWN: {
    let newState = Map();
    state.forEach((module) => {
      const id = module.getIn(['moduleType', 'id']);
      newState = newState.set(id, fromJS(module)).setIn([id, '_hasChanged'], true);
    });
    return state;
  }
  case UPDATE_LANDING_PAGE_MODULES: {
    let newState = Map();
    action.modules.forEach((module) => {
      newState = newState.set(module.moduleType.id, fromJS(module));
    });
    return newState;
  }
  case UPDATE_LANDING_PAGE_MODULE_TITLE:
    return state
      .updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case UPDATE_LANDING_PAGE_MODULE_SUBTITLE:
    return state
      .updateIn([action.id, 'subtitleEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  default:
    return state;
  }
};

const initialPage = Map({
  _hasChanged: false,
  titleEntries: List(),
  subtitleEntries: List(),
  buttonLabelEntries: List(),
  headerImage: Map({
    externalUrl: '',
    mimeType: '',
    title: ''
  }),
  logoImage: Map({
    externalUrl: '',
    mimeType: '',
    title: ''
  })
});
type PageState = Map<string, any>;
type LandingPageReducer = (PageState, ReduxAction<Action>) => PageState;
export const page: LandingPageReducer = (state = initialPage, action) => {
  switch (action.type) {
  case UPDATE_LANDING_PAGE: {
    let newState = state;
    if (action.page.headerImage) {
      newState = newState.set('headerImage', fromJS(action.page.headerImage));
    }
    if (action.page.logoImage) {
      newState = newState.set('logoImage', fromJS(action.page.logoImage));
    }
    newState = newState
      .set('titleEntries', fromJS(action.page.titleEntries))
      .set('subtitleEntries', fromJS(action.page.subtitleEntries))
      .set('buttonLabelEntries', fromJS(action.page.buttonLabelEntries));
    return newState.set('_hasChanged', false);
  }
  case UPDATE_LANDING_PAGE_HEADER_TITLE:
    return state
      .update('titleEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('_hasChanged', true);
  case UPDATE_LANDING_PAGE_HEADER_SUBTITLE:
    return state
      .update('subtitleEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('_hasChanged', true);
  case UPDATE_LANDING_PAGE_HEADER_BUTTON_LABEL:
    return state
      .update('buttonLabelEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('_hasChanged', true);
  case UPDATE_LANDING_PAGE_HEADER_IMAGE:
    return state
      .setIn(['headerImage', 'externalUrl'], action.value)
      .setIn(['headerImage', 'mimeType'], action.value.type)
      .set('_hasChanged', true);
  case UPDATE_LANDING_PAGE_HEADER_LOGO:
    return state
      .setIn(['logoImage', 'externalUrl'], action.value)
      .setIn(['logoImage', 'mimeType'], action.value.type)
      .set('_hasChanged', true);
  default:
    return state;
  }
};

type PageHasChangedReducer = (boolean, ReduxAction<Action>) => boolean;
export const pageHasChanged: PageHasChangedReducer = (state = false, action) => {
  switch (action.type) {
  case UPDATE_LANDING_PAGE_HEADER_TITLE:
  case UPDATE_LANDING_PAGE_HEADER_SUBTITLE:
  case UPDATE_LANDING_PAGE_HEADER_BUTTON_LABEL:
  case UPDATE_LANDING_PAGE_HEADER_IMAGE:
  case UPDATE_LANDING_PAGE_HEADER_LOGO:
    return true;
  case UPDATE_LANDING_PAGE:
    return false;
  default:
    return state;
  }
};

export type LandingPageState = {
  page: PageState,
  enabledModulesInOrder: EnabledModulesInOrderState,
  modulesById: Map<string>,
  modulesHasChanged: boolean,
  pageHasChanged: boolean
};

const reducers = {
  page: page,
  enabledModulesInOrder: enabledModulesInOrder,
  modulesHasChanged: modulesHasChanged,
  modulesById: modulesById,
  pageHasChanged: pageHasChanged
};

export default combineReducers(reducers);