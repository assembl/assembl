const DebateReducer = (state = {}, action) => {
  switch (action.type) {
  case 'ADD_SLUG':
    return { slug: action.slug };
  default:
    return state;
  }
};

export default DebateReducer;