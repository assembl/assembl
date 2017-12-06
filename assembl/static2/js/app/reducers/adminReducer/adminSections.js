// @flow
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';
import {
  type Action,
  UPDATE_SECTIONS,
  UPDATE_SECTION_TITLE,
  UPDATE_SECTION_URL,
  TOGGLE_EXTERNAL_PAGE,
  CREATE_SECTION,
  DELETE_SECTION,
  MOVE_UP_SECTION,
  MOVE_DOWN_SECTION
} from '../../actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';

export const sectionsHaveChanged = (state: boolean = false, action: ReduxAction<Action>) => {
  switch (action.type) {
  case CREATE_SECTION:
  case DELETE_SECTION:
  case UPDATE_SECTION_URL:
  case TOGGLE_EXTERNAL_PAGE:
  case MOVE_UP_SECTION:
  case MOVE_DOWN_SECTION:
  case UPDATE_SECTION_TITLE:
    return true;
  case UPDATE_SECTIONS:
    return false;
  default:
    return state;
  }
};

export const sectionsInOrder = (state: List<string> = List(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case CREATE_SECTION:
    return state.push(action.id);
  case DELETE_SECTION: {
    const idx = state.indexOf(action.id);
    return state.delete(idx);
  }
  case UPDATE_SECTIONS: {
    const sections = action.sections.sort((a, b) => {
      return a.order - b.order;
    });
    return List(
      sections.map((s) => {
        return s.id;
      })
    );
  }
  case MOVE_UP_SECTION: {
    const idx = state.indexOf(action.id);
    return state.delete(idx).insert(idx - 1, action.id);
  }
  case MOVE_DOWN_SECTION: {
    const idx = state.indexOf(action.id);
    return state.delete(idx).insert(idx + 1, action.id);
  }
  default:
    return state;
  }
};

const defaultResource = Map({
  toDelete: false,
  isNew: true,
  titleEntries: List(),
  url: '',
  type: 'CUSTOM'
});

export const sectionsById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case CREATE_SECTION:
    return state.set(action.id, defaultResource.set('id', action.id).set('order', action.order));
  case DELETE_SECTION:
    return state.setIn([action.id, 'toDelete'], true);
  case UPDATE_SECTION_URL:
    return state.setIn([action.id, 'url'], action.value);
  case TOGGLE_EXTERNAL_PAGE:
    return state.updateIn([action.id, 'url'], (url) => {
      if (url !== null) {
        return null;
      }
      return '';
    });
  case UPDATE_SECTION_TITLE:
    return state.updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  case UPDATE_SECTIONS: {
    let newState = Map();
    action.sections.forEach((section) => {
      const sectionInfo = Map({
        isNew: false,
        order: section.order,
        id: section.id,
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

export default combineReducers({
  sectionsHaveChanged: sectionsHaveChanged,
  sectionsInOrder: sectionsInOrder,
  sectionsById: sectionsById
});