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
  UP_SECTION,
  DOWN_SECTION
} from '../../actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';

export const sectionsHaveChanged = (state: boolean = false, action: ReduxAction<Action>) => {
  switch (action.type) {
  case CREATE_SECTION:
  case DELETE_SECTION:
  case UPDATE_SECTION_URL:
  case TOGGLE_EXTERNAL_PAGE:
  case UP_SECTION:
  case DOWN_SECTION:
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
  case CREATE_SECTION:
    return state.push(action.id);
  case UPDATE_SECTIONS: {
    return List(
      action.sections.map((s) => {
        return s.id;
      })
    );
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
  case DELETE_SECTION: {
    return state.setIn([action.id, 'toDelete'], true);
  }
  case UPDATE_SECTION_URL:
    return state.setIn([action.id, 'url'], action.value);
  case UP_SECTION: {
    const previousSectionId = state
      .filter((section) => {
        return section.get('order') === state.getIn([action.id, 'order']) - 1;
      })
      .keySeq()
      .first();
    return state
      .updateIn([previousSectionId, 'order'], (order) => {
        return order + 1;
      })
      .updateIn([action.id, 'order'], (order) => {
        return order - 1;
      });
  }
  case DOWN_SECTION: {
    const nextSectionId = state
      .filter((section) => {
        return section.get('order') === state.getIn([action.id, 'order']) + 1;
      })
      .keySeq()
      .first();
    return state
      .updateIn([nextSectionId, 'order'], (order) => {
        return order - 1;
      })
      .updateIn([action.id, 'order'], (order) => {
        return order + 1;
      });
  }
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
        toDelete: false,
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