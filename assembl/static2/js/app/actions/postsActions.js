export const togglePostResponses = (id) => {
  return {
    id: id,
    type: 'TOGGLE_POST_RESPONSES'
  };
};

export const updateTopPostFormStatus = (isTopPostFormActive) => {
  return {
    isTopPostFormActive: isTopPostFormActive,
    type: 'UPDATE_TOP_POST_FORM_STATUS'
  };
};

export const updateTopPostSubject = (topPostSubject) => {
  return {
    topPostSubject: topPostSubject,
    type: 'UPDATE_TOP_POST_SUBJECT'
  };
};

export const updateTopPostBody = (topPostBody) => {
  return {
    topPostBody: topPostBody,
    type: 'UPDATE_TOP_POST_BODY'
  };
};

export const updateTopPostSubjectRemaingChars = (subjectTopPostRemainingChars) => {
  return {
    subjectTopPostRemainingChars: subjectTopPostRemainingChars,
    type: 'UPDATE_TOP_POST_SUBJECT_REMAINING_CHARS'
  };
};

export const updateActiveAnswerFormId = (activeAnswerFormId) => {
  return {
    activeAnswerFormId: activeAnswerFormId,
    type: 'UPDATE_ACTIVE_ANSWER_FORM_ID'
  };
};

export const updateAnswerPostBody = (answerPostBody) => {
  return {
    answerPostBody: answerPostBody,
    type: 'UPDATE_ANSWER_POST_BODY'
  };
};

export const updateAnswerPostBodyRemaingChars = (bodyAnswerPostRemainingChars) => {
  return {
    bodyAnswerPostRemainingChars: bodyAnswerPostRemainingChars,
    type: 'UPDATE_ANSWER_POST_BODY_REMAINING_CHARS'
  };
};