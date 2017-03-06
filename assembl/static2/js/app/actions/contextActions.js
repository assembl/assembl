const resolvedAddContext = (rootPath, debateId, connectedUserId) => {
  return {
    type: 'ADD_CONTEXT',
    rootPath: rootPath,
    debateId: debateId,
    connectedUserId: connectedUserId
  };
};

export const addContext = (rootPath, debateId, connectedUserId) => {
  return function (dispatch) {
    dispatch(resolvedAddContext(rootPath, debateId, connectedUserId));
  };
};