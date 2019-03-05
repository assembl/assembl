const initialState = {
  tags: [],
  suggestions: []
};

const tagReducer = (state = initialState, action) => {
  switch (action.type) {
  case 'ADD_TAG':
    return {
      ...state,
      tags: [...state.tags].concat(action.tag),
      suggestions: [...state.tags].concat(action.tag)
    };
  case 'DELETE_TAG':
    return {
      ...state,
      tags: state.tags.filter((tag, index) => index !== action.tagKey),
      suggestions: state.tags.filter((tag, index) => index !== action.tagKey)
    };
  default:
    return state;
  }
};

export default tagReducer;