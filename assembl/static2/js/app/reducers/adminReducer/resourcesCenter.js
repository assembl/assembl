import { combineReducers } from 'redux';
import { List, Map } from 'immutable';

import {
  CREATE_RESOURCE,
  DELETE_RESOURCE,
  UPDATE_RESOURCE_EMBED_CODE,
  UPDATE_RESOURCE_IMAGE,
  UPDATE_RESOURCE_TEXT,
  UPDATE_RESOURCE_TITLE
} from '../../actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';

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
  img: Map({
    externalUrl: '',
    mimeType: ''
  }),
  titleEntries: List(),
  textEntries: List(),
  embedCode: ''
});
export const resourcesById = (state = Map(), action) => {
  switch (action.type) {
  case CREATE_RESOURCE:
    return state.set(action.id, defaultResource.set('id', action.id).set('order', action.order));
  case DELETE_RESOURCE:
    return state.setIn([action.id, 'toDelete'], true);
  case UPDATE_RESOURCE_EMBED_CODE:
    return state.setIn([action.id, 'embedCode'], action.value);
  case UPDATE_RESOURCE_IMAGE:
    return state
      .setIn([action.id, 'img', 'externalUrl'], action.value)
      .setIn([action.id, 'img', 'mimeType'], action.value.type);
  case UPDATE_RESOURCE_TEXT:
    return state.updateIn([action.id, 'textEntries'], updateInLangstringEntries(action.locale, action.value));
  case UPDATE_RESOURCE_TITLE:
    return state.updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  default:
    return state;
  }
};

export default combineReducers({
  resourcesInOrder: resourcesInOrder,
  resourcesById: resourcesById
});