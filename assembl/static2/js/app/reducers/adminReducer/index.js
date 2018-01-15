// @flow
import { fromJS, List, Map } from 'immutable';
import { combineReducers } from 'redux';
import type ReduxAction from 'redux';

import { type Action } from '../../actions/actionTypes';
import legalNoticeAndTerms from './legalNoticeAndTerms';
import type { LegalNoticeAndTermsReducer } from './legalNoticeAndTerms';
import resourcesCenter from './resourcesCenter';
import sections from './adminSections';
import voteSession from './voteSession';
import type { AdminSectionsReducers } from './adminSections';
import landingPage from './landingPage';
import type { LandingPageReducer } from './landingPage';
import { updateInLangstringEntries } from '../../utils/i18n';

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

type ThematicsInOrderState = List;
type ThematicsInOrderReducer = (ThematicsInOrderState, ReduxAction<Action>) => ThematicsInOrderState;
export const thematicsInOrder: ThematicsInOrderReducer = (state = List(), action) => {
  switch (action.type) {
  case 'CREATE_NEW_THEMATIC':
    return state.push(action.id);
  case 'UPDATE_THEMATICS': {
    return List(action.thematics.map(t => t.id));
  }
  default:
    return state;
  }
};

type ThematicsByIdState = Map;
type ThematicsByIdReducer = (ThematicsByIdState, ReduxAction<Action>) => ThematicsByIdState;
export const thematicsById: ThematicsByIdReducer = (state = Map(), action) => {
  switch (action.type) {
  case 'ADD_QUESTION_TO_THEMATIC': {
    const newQuestion = fromJS({
      titleEntries: [{ localeCode: action.locale, value: '' }]
    });
    return state.updateIn([action.id, 'questions'], questions => questions.push(newQuestion));
  }
  case 'CREATE_NEW_THEMATIC': {
    const emptyThematic = Map({
      toDelete: false,
      img: Map({
        externalUrl: ''
      }),
      isNew: true,
      questions: List(),
      titleEntries: List(),
      video: null
    });
    return state.set(action.id, emptyThematic.set('id', action.id));
  }
  case 'DELETE_THEMATIC':
    return state.setIn([action.id, 'toDelete'], true);
  case 'REMOVE_QUESTION':
    return state.updateIn([action.thematicId, 'questions'], questions => questions.remove(action.index));
  case 'UPDATE_QUESTION_TITLE':
    return state.updateIn([action.thematicId, 'questions', action.index, 'titleEntries'], (titleEntries) => {
      const titleEntryIndex = titleEntries.findIndex(entry => entry.get('localeCode') === action.locale);

      if (titleEntryIndex === -1) {
        return titleEntries.push(Map({ localeCode: action.locale, value: action.value }));
      }

      return titleEntries.setIn([titleEntryIndex, 'value'], action.value);
    });
  case 'UPDATE_THEMATIC_IMG_URL': {
    if (state.getIn([action.id, 'img'])) {
      return state
        .setIn([action.id, 'img', 'externalUrl'], action.value)
        .setIn([action.id, 'img', 'mimeType'], action.value.type);
    }

    return state.setIn([action.id, 'img'], Map({ mimeType: action.value.type, externalUrl: action.value }));
  }
  case 'UPDATE_THEMATIC_TITLE': {
    return state.updateIn([action.id, 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  }
  case 'UPDATE_THEMATICS': {
    const newState = {};
    action.thematics.forEach((t) => {
      newState[t.id] = {
        ...t
      };
    });
    return fromJS(newState);
  }
  case 'TOGGLE_VIDEO':
    return state.updateIn([action.id, 'video'], (video) => {
      if (video) {
        return null;
      }
      return fromJS({
        descriptionEntriesTop: [],
        descriptionEntriesBottom: [],
        descriptionEntriesSide: [],
        htmlCode: '',
        titleEntries: []
      });
    });
  case 'UPDATE_VIDEO_DESCRIPTION_TOP':
    return state.updateIn(
      [action.id, 'video', 'descriptionEntriesTop'],
      updateInLangstringEntries(action.locale, fromJS(action.value))
    );
  case 'UPDATE_VIDEO_DESCRIPTION_BOTTOM':
    return state.updateIn(
      [action.id, 'video', 'descriptionEntriesBottom'],
      updateInLangstringEntries(action.locale, fromJS(action.value))
    );
  case 'UPDATE_VIDEO_DESCRIPTION_SIDE':
    return state.updateIn(
      [action.id, 'video', 'descriptionEntriesSide'],
      updateInLangstringEntries(action.locale, fromJS(action.value))
    );
  case 'UPDATE_VIDEO_HTML_CODE':
    return state.setIn([action.id, 'video', 'htmlCode'], action.value);
  case 'UPDATE_VIDEO_TITLE':
    return state.updateIn([action.id, 'video', 'titleEntries'], updateInLangstringEntries(action.locale, action.value));
  default:
    return state;
  }
};

type ThematicsHaveChangedReducer = (boolean, ReduxAction<Action>) => boolean;
export const thematicsHaveChanged: ThematicsHaveChangedReducer = (state = false, action) => {
  switch (action.type) {
  case 'UPDATE_THEMATICS':
    return false;
  case 'ADD_QUESTION_TO_THEMATIC':
  case 'CREATE_NEW_THEMATIC':
  case 'DELETE_THEMATIC':
  case 'REMOVE_QUESTION':
  case 'UPDATE_QUESTION_TITLE':
  case 'UPDATE_THEMATIC_IMG_URL':
  case 'UPDATE_THEMATIC_TITLE':
  case 'TOGGLE_VIDEO':
  case 'UPDATE_VIDEO_DESCRIPTION_TOP':
  case 'UPDATE_VIDEO_DESCRIPTION_BOTTOM':
  case 'UPDATE_VIDEO_DESCRIPTION_SIDE':
  case 'UPDATE_VIDEO_HTML_CODE':
  case 'UPDATE_VIDEO_TITLE':
    return true;
  default:
    return state;
  }
};

const hasLocale = (l: string, arr: Array<string>): boolean => {
  const i = arr.findIndex(a => a === l);
  return i >= 0;
};

type LanguagePreferencesState = List<string>;
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

type DisplayLanguageMenu = boolean;
type DisplayLanguageMenuReducer = (DisplayLanguageMenu, ReduxAction<Action>) => DisplayLanguageMenu;
export const displayLanguageMenu: DisplayLanguageMenuReducer = (state = false, action) => {
  switch (action.type) {
  case 'UPDATE_LANGUAGE_MENU_VISIBILITY':
    return action.state;
  default:
    return state;
  }
};

type ResourcesCenterReducer = Function; // TODO
export type AdminReducer = {
  editLocale: EditLocaleReducer,
  thematicsHaveChanged: ThematicsHaveChangedReducer,
  thematicsInOrder: ThematicsInOrderReducer,
  thematicsById: ThematicsByIdReducer,
  discussionLanguagePreferences: LanguagePreferencesReducer,
  discussionLanguagePreferencesHasChanged: DiscussionLanguagePreferencesHasChangedReducer,
  displayLanguageMenu: DisplayLanguageMenuReducer,
  resourcesCenter: ResourcesCenterReducer,
  sections: AdminSectionsReducers,
  legalNoticeAndTerms: LegalNoticeAndTermsReducer,
  landingPage: LandingPageReducer
};

const reducers: AdminReducer = {
  editLocale: editLocale,
  thematicsHaveChanged: thematicsHaveChanged,
  thematicsInOrder: thematicsInOrder,
  thematicsById: thematicsById,
  discussionLanguagePreferences: languagePreferences,
  discussionLanguagePreferencesHasChanged: discussionLanguagePreferencesHasChanged,
  displayLanguageMenu: displayLanguageMenu,
  resourcesCenter: resourcesCenter,
  sections: sections,
  voteSession: voteSession,
  legalNoticeAndTerms: legalNoticeAndTerms,
  landingPage: landingPage
};

export default combineReducers(reducers);