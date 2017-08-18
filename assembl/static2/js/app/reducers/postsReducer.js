import { combineReducers } from 'redux';

import { createEmptyRawContentState } from '../utils/draftjs';

export const basicReducerFactory = (initialState, handledAction, returnedProp) => {
  return (state = initialState, action) => {
    switch (action.type) {
    case handledAction:
      return action[returnedProp];
    default:
      return state;
    }
  };
};

export const topPostSubject = basicReducerFactory('', 'UPDATE_TOP_POST_SUBJECT', 'topPostSubject');
export const topPostBody = basicReducerFactory(createEmptyRawContentState(), 'UPDATE_TOP_POST_BODY', 'topPostBody');
export const topPostFormStatus = basicReducerFactory(false, 'UPDATE_TOP_POST_FORM_STATUS', 'isTopPostFormActive');

export default combineReducers({
  topPostSubject: topPostSubject,
  topPostBody: topPostBody,
  topPostFormStatus: topPostFormStatus
});