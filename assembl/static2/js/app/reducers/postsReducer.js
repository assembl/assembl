import { EditorState } from 'draft-js';
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
export const topPostBody = basicReducerFactory(EditorState.createEmpty(), 'UPDATE_TOP_POST_BODY', 'topPostBody');
export const answerPostBody = basicReducerFactory('', 'UPDATE_ANSWER_POST_BODY', 'answerPostBody');
export const subjectTopPostRemainingChars = basicReducerFactory(
  10000,
  'UPDATE_TOP_POST_SUBJECT_REMAINING_CHARS',
  'subjectTopPostRemainingChars'
);
export const bodyTopPostRemainingChars = basicReducerFactory(
  10000,
  'UPDATE_TOP_POST_BODY_REMAINING_CHARS',
  'bodyTopPostRemainingChars'
);
export const bodyAnswerPostRemainingChars = basicReducerFactory(
  10000,
  'UPDATE_ANSWER_POST_BODY_REMAINING_CHARS',
  'bodyAnswerPostRemainingChars'
);
export const topPostFormStatus = basicReducerFactory(false, 'UPDATE_TOP_POST_FORM_STATUS', 'isTopPostFormActive');
export const activeAnswerFormId = basicReducerFactory(null, 'UPDATE_ACTIVE_ANSWER_FORM_ID', 'activeAnswerFormId');

export default combineReducers({
  postsById: postsById,
  topPostSubject: topPostSubject,
  topPostBody: topPostBody,
  topPostFormStatus: topPostFormStatus,
  subjectTopPostRemainingChars: subjectTopPostRemainingChars,
  bodyTopPostRemainingChars: bodyTopPostRemainingChars,
  answerPostBody: answerPostBody,
  bodyAnswerPostRemainingChars: bodyAnswerPostRemainingChars,
  activeAnswerFormId: activeAnswerFormId
});