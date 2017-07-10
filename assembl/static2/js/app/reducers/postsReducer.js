import { Map } from 'immutable';
import { combineReducers } from 'redux';

import { SHOW_POST_RESPONSES } from '../constants';

export const postsById = (state = Map(), action) => {
  if (action.type === 'TOGGLE_POST_RESPONSES') {
    const showResponses = state.getIn([action.id, 'showResponses'], SHOW_POST_RESPONSES);
    return state.setIn([action.id, 'showResponses'], !showResponses);
  }
  return state;
};

export const topPostSubject = (state = '', action) => {
  switch (action.type) {
  case 'UPDATE_TOP_POST_SUBJECT':
    return action.topPostSubject;
  default:
    return state;
  }
};

export const topPostBody = (state = '', action) => {
  switch (action.type) {
  case 'UPDATE_TOP_POST_BODY':
    return action.topPostBody;
  default:
    return state;
  }
};

export const topPostFormStatus = (state = false, action) => {
  switch (action.type) {
  case 'UPDATE_TOP_POST_FORM_STATUS':
    return action.isTopPostFormActive;
  default:
    return state;
  }
};

export default combineReducers({
  postsById: postsById,
  topPostSubject: topPostSubject,
  topPostBody: topPostBody,
  topPostFormStatus: topPostFormStatus
});