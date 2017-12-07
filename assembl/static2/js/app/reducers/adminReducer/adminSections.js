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

type SectionsHaveChanged = boolean;
type SectionsHaveChangedReducer = (SectionsHaveChanged, ReduxAction<Action>) => SectionsHaveChanged;
export const sectionsHaveChanged: SectionsHaveChangedReducer = (state = false, action) => {
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

type SectionsInOrder = List<string>;
type SectionsInOrderReducer = (SectionsInOrder, ReduxAction<Action>) => SectionsInOrder;
export const sectionsInOrder: SectionsInOrderReducer = (state = List(), action) => {
  switch (action.type) {
  case CREATE_SECTION:
    return state.push(action.id);
  case DELETE_SECTION: {
    const idx = state.indexOf(action.id);
    return state.delete(idx);
  }
  case UPDATE_SECTIONS: {
    const sections = action.sections.sort((a, b) => a.order - b.order);
    return List(sections.map(s => s.id));
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
type SectionsById = Map<string, Map>;
type SectionsByIdReducer = (SectionsById, ReduxAction<Action>) => SectionsById;
export const sectionsById: SectionsByIdReducer = (state = Map(), action) => {
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

export type AdminSectionsReducers = {
  sectionsHaveChanged: SectionsHaveChangedReducer,
  sectionsInOrder: SectionsInOrderReducer,
  sectionsById: SectionsByIdReducer
};
const reducers: AdminSectionsReducers = {
  sectionsHaveChanged: sectionsHaveChanged,
  sectionsInOrder: sectionsInOrder,
  sectionsById: sectionsById
};

export default combineReducers(reducers);