// @flow
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

import sections from './adminSections';
import voteSession from './voteSession';
import landingPage from './landingPage';
import profileOptions from './profileOptions';

/*
  The locale that is used to edit the content in the administration
*/
export const editLocale = (state: string = 'fr', action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.UPDATE_EDIT_LOCALE:
    return action.newLocale;
  default:
    return state;
  }
};

export const displayLanguageMenu = (state: boolean = false, action: ReduxAction) => {
  switch (action.type) {
  case actionTypes.UPDATE_LANGUAGE_MENU_VISIBILITY:
    return action.state;
  default:
    return state;
  }
};

const reducers = {
  editLocale: editLocale,
  displayLanguageMenu: displayLanguageMenu,
  sections: sections,
  voteSession: voteSession,
  landingPage: landingPage,
  profileOptions: profileOptions
};

export default combineReducers(reducers);