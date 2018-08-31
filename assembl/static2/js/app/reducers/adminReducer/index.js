// @flow
import { List } from 'immutable';
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';

import { type Action } from '../../actions/actionTypes';
import timeline from './timeline';
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
    return action.newLocale;
  default:
    return state;
  }
};

const hasLocale = (l: string, arr: Array<string>): boolean => {
  const i = arr.findIndex(a => a === l);
  return i >= 0;
};

export type LanguagePreferencesState = List<string>;
type LanguagePreferencesReducer = (LanguagePreferencesState, ReduxAction<Action>) => LanguagePreferencesState;
export const languagePreferences: LanguagePreferencesReducer = (state = List(), action) => {
  switch (action.type) {
  case 'ADD_LANGUAGE_PREFERENCE':
    // Language preferences can be added in different components
    if (!hasLocale(action.locale, state)) {
      return state.push(action.locale);
    }
    return state;
  case 'REMOVE_LANGUAGE_PREFERENCE':
    if (hasLocale(action.locale, state)) {
      const i = state.findIndex(a => a === action.locale);
      return state.delete(i);
    }
    return state;
  default:
    return state;
  }
};

type DiscussionLanguagePreferencesHasChangedReducer = (boolean, ReduxAction<Action>) => boolean;
export const discussionLanguagePreferencesHasChanged: DiscussionLanguagePreferencesHasChangedReducer = (
  state = false,
  action
) => {
  switch (action.type) {
  case 'LANGUAGE_PREFERENCE_HAS_CHANGED':
    return action.state;
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
  discussionLanguagePreferences: languagePreferences,
  discussionLanguagePreferencesHasChanged: discussionLanguagePreferencesHasChanged,
  displayLanguageMenu: displayLanguageMenu,
  sections: sections,
  voteSession: voteSession,
  landingPage: landingPage,
  profileOptions: profileOptions,
  timeline: timeline
};

export default combineReducers(reducers);