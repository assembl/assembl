const resolvedAddContext = (rootPath, debateId, connectedUserId, connectedUserName) => ({
  type: 'ADD_CONTEXT',
  rootPath: rootPath,
  debateId: debateId,
  connectedUserId: connectedUserId,
  connectedUserName: connectedUserName
});

export const addContext = (rootPath, debateId, connectedUserId, connectedUserName) =>
  function (dispatch) {
    dispatch(resolvedAddContext(rootPath, debateId, connectedUserId, connectedUserName));
  };