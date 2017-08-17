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
export const answerPostBody = basicReducerFactory(createEmptyRawContentState(), 'UPDATE_ANSWER_POST_BODY', 'answerPostBody');
export const subjectTopPostRemainingChars = basicReducerFactory(
  10000,
  'UPDATE_TOP_POST_SUBJECT_REMAINING_CHARS',
  'subjectTopPostRemainingChars'
);
export const topPostFormStatus = basicReducerFactory(false, 'UPDATE_TOP_POST_FORM_STATUS', 'isTopPostFormActive');
export const activeAnswerFormId = basicReducerFactory(null, 'UPDATE_ACTIVE_ANSWER_FORM_ID', 'activeAnswerFormId');

export default combineReducers({
  topPostSubject: topPostSubject,
  topPostBody: topPostBody,
  topPostFormStatus: topPostFormStatus,
  subjectTopPostRemainingChars: subjectTopPostRemainingChars,
  answerPostBody: answerPostBody,
  activeAnswerFormId: activeAnswerFormId
});