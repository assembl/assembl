// @flow
import type ReduxAction from 'redux';
import * as actionTypes from '../../../js/app/actions/actionTypes';

const initialState = {
  firstColor: '#000000',
  secondColor: '#000000'
};

const ThemeReducer = (state: Object = initialState, action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.SET_THEME:
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