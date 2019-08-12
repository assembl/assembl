// @flow
import * as actionTypes from '../actionTypes';

export const updateEditLocale = (newLocale: string) => ({
  newLocale: newLocale,
  type: actionTypes.UPDATE_EDIT_LOCALE
});

export const displayLanguageMenu = (state: boolean) => ({
  state: state,
  type: actionTypes.UPDATE_LANGUAGE_MENU_VISIBILITY
});