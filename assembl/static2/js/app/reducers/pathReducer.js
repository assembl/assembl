const pathReducer = (state = {}, action) => {
  switch (action.type) {
  case 'ADD_PATH':
    return {rootPath : action.rootPath};
  default:
    return state;
  }
};

export default pathReducer;