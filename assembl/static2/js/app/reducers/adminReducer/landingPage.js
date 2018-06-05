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
type ModulesByIdentifierState = Map<string, Map>;
type ModulesByIdentifierReducer = (ModulesByIdentifierState, ReduxAction<Action>) => ModulesByIdentifierState;
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
const page: LandingPageReducer = (state = initialPage, action) => {
  switch (action.type) {
  case UPDATE_LANDING_PAGE: {
    let headerImage = Map({
      externalUrl: '',
      mimeType: '',
      title: ''
    });
    let logoImage = Map({
      externalUrl: '',
      mimeType: '',
      title: ''
    });
    if (action.headerImage) {
      headerImage = fromJS(action.headerImage);
    }
    if (action.logoImage) {
      logoImage = fromJS(action.logoImage);
    }
    return Map({
      _hasChanged: false,
      titleEntries: fromJS(action.titleEntries),
      subtitleEntries: fromJS(action.subtitleEntries),
      buttonLabelEntries: fromJS(action.buttonLabelEntries),
      headerImage: headerImage,
      logoImage: logoImage
    });
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
  modulesByIdentifier: Map<string>,
  modulesHasChanged: boolean,
  pageHasChanged: boolean
};

const reducers = {
  page: page,
  enabledModulesInOrder: enabledModulesInOrder,
  modulesHasChanged: modulesHasChanged,
  modulesByIdentifier: modulesByIdentifier,
  pageHasChanged: pageHasChanged
};

export default combineReducers(reducers);