import { combineReducers } from 'redux';
import { List, Map } from 'immutable';

import { CREATE_RESOURCE } from '../../actions/actionTypes';

export const resourcesInOrder = (state = List(), action) => {
  switch (action.type) {
  case CREATE_RESOURCE:
    return state.push(action.id);
  default:
    return state;
  }
};

const defaultResource = Map({
  toDelete: false,
  isNew: true,
  titleEntries: List(),
  textEntries: List(),
  embedCode: ''
});
export const resourcesById = (state = Map(), action) => {
  switch (action.type) {
  case CREATE_RESOURCE:
    return state.set(action.id, defaultResource.set('id', action.id).set('order', action.order));
  default:
    return state;
  }
};

export default combineReducers({
  resourcesInOrder: resourcesInOrder,
  resourcesById: resourcesById
});