const ContextReducer = (state = {}, action) => {
  switch (action.type) {
  case 'ADD_CONTEXT':
    return { rootPath: action.rootPath, debateId: action.debateId, connectedUserId: action.connectedUserId };
  default:
    return state;
  }
};

export default ContextReducer;

export const getConnectedUserId = (state) => {
  return state.context.connectedUserId;
};

export const getDebateId = (state) => {
  return state.context.debateId;
};

export const getLocale = (state) => {
  return state.i18n.locale;
};