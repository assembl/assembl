import { Map } from 'immutable';
import { combineReducers } from 'redux';

export const postsById = (state = Map(), action) => {
  if (action.type === 'TOGGLE_POST_RESPONSES') {
    const showResponses = state.getIn([action.id, 'showResponses'], false);
    return state.setIn([action.id, 'showResponses'], !showResponses);
  }
  return state;
};

export default combineReducers({ postsById: postsById });