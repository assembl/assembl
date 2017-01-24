const MapStateToProps = (state) => {
  return {
    i18n: state.i18n,
    debate: state.debate,
    posts: state.posts,
    users: state.users,
    path: state.path
  };
};

export default MapStateToProps;