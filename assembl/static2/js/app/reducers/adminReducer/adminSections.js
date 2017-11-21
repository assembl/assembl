// @flow
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';

import { type Action, UPDATE_SECTIONS } from '../../actions/actionTypes';

export const sectionsHaveChanged = (state: boolean = false, action: ReduxAction<Action>) => {
  switch (action.type) {
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
      action.sections.map((r) => {
        return r.id;
      })
    );
  default:
    return state;
  }
};

export const sectionsById = (state: Map<string, Map> = Map(), action: ReduxAction<Action>) => {
  switch (action.type) {
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