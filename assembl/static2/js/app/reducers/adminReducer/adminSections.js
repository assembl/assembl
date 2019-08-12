// @flow
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';
import * as actionTypes from '../../../../js/app/actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';

export const sectionsHaveChanged = (state: boolean = false, action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.CREATE_SECTION:
  case actionTypes.DELETE_SECTION:
  case actionTypes.UPDATE_SECTION_URL:
  case actionTypes.TOGGLE_EXTERNAL_PAGE:
  case actionTypes.MOVE_UP_SECTION:
  case actionTypes.MOVE_DOWN_SECTION:
  case actionTypes.UPDATE_SECTION_TITLE:
    return true;
  case actionTypes.UPDATE_SECTIONS:
    return false;
  default:
    return state;
  }
};

export const sectionsInOrder = (state: List<string> = List(), action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.CREATE_SECTION:
    return state.push(action.id);
  case actionTypes.DELETE_SECTION: {
    const idx = state.indexOf(action.id);
    return state.delete(idx);
  }
  case actionTypes.UPDATE_SECTIONS: {
    const sections = action.sections.sort((a, b) => a.order - b.order);
    return List(sections.map(s => s.id));
  }
  case actionTypes.MOVE_UP_SECTION: {
    const idx = state.indexOf(action.id);
    return state.delete(idx).insert(idx - 1, action.id);
  }
  case actionTypes.MOVE_DOWN_SECTION: {
    const idx = state.indexOf(action.id);
    return state.delete(idx).insert(idx + 1, action.id);
  }
  default:
    return state;
  }
};

const defaultSection = Map({
  _hasChanged: false,
  _isNew: true,
  _toDelete: false,
  titleEntries: List(),
  url: '',
  type: 'CUSTOM'
});

export const sectionsById = (state: Map<string, Map> = Map(), action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.CREATE_SECTION:
    return state.set(action.id, defaultSection.set('id', action.id).set('order', action.order));
  case actionTypes.DELETE_SECTION:
    return state.setIn([action.id, '_toDelete'], true);
  case actionTypes.UPDATE_SECTION_URL:
    return state.setIn([action.id, 'url'], action.value).setIn([action.id, '_hasChanged'], true);
  case actionTypes.TOGGLE_EXTERNAL_PAGE:
    return state
      .updateIn([action.id, 'url'], (url) => {
        if (url !== null) {
          return null;
        }
        return '';
      })
      .setIn([action.id, '_hasChanged'], true);
  case actionTypes.UPDATE_SECTION_TITLE:
    return state
      .updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value))
      .setIn([action.id, '_hasChanged'], true);
  case actionTypes.UPDATE_SECTIONS: {
    let newState = Map();
    action.sections.forEach((section) => {
      const sectionInfo = Map({
        _hasChanged: false,
        _isNew: false,
        _toDelete: false,
        id: section.id,
        order: section.order,
        titleEntries: fromJS(section.titleEntries),
        url: section.url,
        type: section.sectionType
      });

      newState = newState.set(section.id, sectionInfo);
    });

    return newState;
  }
  default:
    return state;
  }
};

const reducers = {
  sectionsHaveChanged: sectionsHaveChanged,
  sectionsInOrder: sectionsInOrder,
  sectionsById: sectionsById
};

export default combineReducers(reducers);