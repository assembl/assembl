const ContextReducer = (state = {}, action) => {
  switch (action.type) {
  case 'ADD_CONTEXT':
    return { rootPath: action.rootPath, debateId: action.debateId, connectedUserId: action.connectedUserId };
  default:
    return state;
  }
};

export default ContextReducer;