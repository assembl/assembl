// @flow

export const setTheme = (firstColor: string, secondColor: string) => ({
  firstColor: firstColor,
  secondColor: secondColor,
  type: 'SET_THEME'
});