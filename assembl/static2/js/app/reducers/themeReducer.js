const initialState = {
  firstColor: '#000000',
  secondColor: '#000000'
};

const ThemeReducer = (state = initialState, action) => {
  switch (action.type) {
  case 'SET_THEME':
    return {
      ...state,
      firstColor: action.firstColor,
      secondColor: action.secondColor
    };
  default:
    return state;
  }
};

export default ThemeReducer;