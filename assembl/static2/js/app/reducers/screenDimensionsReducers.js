const singleReducer = (type, key, initialState) => (state = initialState, action) => {
  switch (action.type) {
  case type:
    if (key in action) return action[key]; // eslint-disable-line no-fallthrough
  default:
    return state;
  }
};

export const screenWidth = singleReducer('UPDATE_SCREEN_DIMENSIONS', 'newWidth', 0);
export const screenHeight = singleReducer('UPDATE_SCREEN_DIMENSIONS', 'newHeight', 0);