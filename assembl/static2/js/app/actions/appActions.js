class DebateActions {
  static getSlug(slug) {
    const that = this;
    return function (dispatch) {
      dispatch(that.addSlug(slug));
    };
  }
  static addSlug(slug) {
    return {
      type: 'ADD_SLUG',
      slug: `v2/${slug}`
    };
  }
}

export default DebateActions;