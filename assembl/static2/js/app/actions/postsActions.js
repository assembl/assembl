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