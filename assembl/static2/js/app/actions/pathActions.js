class PathActions {
  static addPath(rootPath) {
    const that = this;
    return function (dispatch) {
      dispatch(that.resolvedAddPath(rootPath));
    };
  }
  static resolvedAddPath(rootPath) {
    return {
      type: 'ADD_PATH',
      rootPath: rootPath
    };
  }
}

export default PathActions;