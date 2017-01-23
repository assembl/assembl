const pathReducer = (state = {}, action) => {
  switch (action.type) {
  case 'ADD_PATH':
    return action.path;
  default:
    return state;
  }
};

export default pathReducer;