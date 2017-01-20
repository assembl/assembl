class PathActions {
  static addPath(path) {
    const that = this;
    return function (dispatch) {
      dispatch(that.resolvedAddPath(path));
    };
  }
  static resolvedAddPath(path) {
    return {
      type: 'ADD_PATH',
      path: path
    };
  }
}

export default PathActions;