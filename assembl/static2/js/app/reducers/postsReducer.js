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

export default combineReducers({ postsById: postsById });