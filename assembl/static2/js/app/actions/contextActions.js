class ContextActions {
  static addContext(rootPath, debateId, connectedUserId) {
    const that = this;
    return function (dispatch) {
      dispatch(that.resolvedAddContext(rootPath, debateId, connectedUserId));
    };
  }
  static resolvedAddContext(rootPath, debateId, connectedUserId) {
    return {
      type: 'ADD_CONTEXT',
      rootPath: rootPath,
      debateId: debateId,
      connectedUserId: connectedUserId
    };
  }
}

export default ContextActions;