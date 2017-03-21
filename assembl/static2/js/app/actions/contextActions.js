const resolvedAddContext = (rootPath, debateId, connectedUserId, connectedUserName) => {
  return {
    type: 'ADD_CONTEXT',
    rootPath: rootPath,
    debateId: debateId,
    connectedUserId: connectedUserId,
    connectedUserName: connectedUserName
  };
};

export const addContext = (rootPath, debateId, connectedUserId, connectedUserName) => {
  return function (dispatch) {
    dispatch(resolvedAddContext(rootPath, debateId, connectedUserId, connectedUserName));
  };
};