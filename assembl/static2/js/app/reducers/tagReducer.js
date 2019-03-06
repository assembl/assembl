const TagReducer = (state = [], action) => {
  switch (action.type) {
  case 'UPDATE_TAGS':
    return action.tags ? action.tags : [];
  default:
    return state;
  }
};

export default TagReducer;