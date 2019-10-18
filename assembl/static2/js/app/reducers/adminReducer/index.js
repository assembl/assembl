/* eslint-disable */
// @flow
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';

import { type Action } from '../../actions/actionTypes';
import sections from './adminSections';
import voteSession from './voteSession';
import landingPage from './landingPage';
import profileOptions from './profileOptions';

type EditLocaleState = string;
type EditLocaleReducer = (EditLocaleState, ReduxAction<Action>) => EditLocaleState;
/*
  The locale that is used to edit the content in the administration
*/
export const editLocale: EditLocaleReducer = (state = 'fr', action) => {
  switch (action.type) {
    case 'UPDATE_EDIT_LOCALE':
      console.log('HERE', action.newLocale);
      return action.newLocale;
    default:
      return state;
  }
};

type DisplayLanguageMenuState = boolean;
type DisplayLanguageMenuReducer = (DisplayLanguageMenuState, ReduxAction<Action>) => DisplayLanguageMenuState;
export const displayLanguageMenu: DisplayLanguageMenuReducer = (state = false, action) => {
  switch (action.type) {
    case 'UPDATE_LANGUAGE_MENU_VISIBILITY':
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
