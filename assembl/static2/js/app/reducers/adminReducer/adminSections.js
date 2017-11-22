// @flow
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';
import {
  type Action,
  UPDATE_SECTIONS,
  UPDATE_SECTION_TITLE,
  UPDATE_SECTION_URL,
  TOGGLE_EXTERNAL_PAGE
} from '../../actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';

export const sectionsHaveChanged = (state: boolean = false, action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_SECTION_URL:
  case TOGGLE_EXTERNAL_PAGE:
  case UPDATE_SECTION_TITLE:
    return true;
  case UPDATE_SECTIONS:
    return false;
  default:
    return state;
  }
};

export const sectionsInOrder = (state: List<number> = List(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_SECTIONS:
    return List(
      action.sections.map((s) => {
        return s.id;
      })
    );
  default:
    return state;
  }
};

export const sectionsById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
  case UPDATE_SECTION_URL:
    return state.setIn([action.id, 'url'], action.value);
  case TOGGLE_EXTERNAL_PAGE:
    return state.updateIn([action.id, 'url'], (url) => {
      if (url) {
        return null;
      }
      return fromJS({ url: '' });
    });
  case UPDATE_SECTION_TITLE:
    return state.updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  case UPDATE_SECTIONS: {
    let newState = Map();
    action.sections.forEach((section, index) => {
      const sectionInfo = Map({
        toDelete: false,
        isNew: false,
        order: index + 1,
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