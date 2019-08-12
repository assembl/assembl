// @flow
import * as actionTypes from './actionTypes';

export const setTheme = (firstColor: string, secondColor: string) => ({
  firstColor: firstColor,
  secondColor: secondColor,
  type: actionTypes.SET_THEME
});