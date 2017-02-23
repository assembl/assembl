const MapStateToProps = (state) => {
  return {
    i18n: state.i18n,
    debate: state.debate,
    posts: state.posts,
    users: state.users,
    partners: state.partners,
    context: state.context,
    ideas: state.ideas,
    synthesis: state.synthesis
  };
};

export default MapStateToProps;