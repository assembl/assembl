import { fromJS, List, Map } from 'immutable';
import { combineReducers } from 'redux';

import resourcesCenter from './resourcesCenter';
import { updateInLangstringEntries } from '../../utils/i18n';

export const selectedLocale = (state = 'fr', action) => {
  switch (action.type) {
  case 'UPDATE_SELECTED_LOCALE':
    return action.newLocale;
  default:
    return state;
  }
};

export const thematicsInOrder = (state = List(), action) => {
  switch (action.type) {
  case 'CREATE_NEW_THEMATIC':
    return state.push(action.id);
  case 'UPDATE_THEMATICS': {
    return List(
      action.thematics.map((t) => {
        return t.id;
      })
    );
  }
  default:
    return state;
  }
};

export const thematicsById = (state = Map(), action) => {
  switch (action.type) {
  case 'ADD_QUESTION_TO_THEMATIC': {
    const newQuestion = fromJS({
      titleEntries: [{ localeCode: action.locale, value: '' }]
    });
    return state.updateIn([action.id, 'questions'], (questions) => {
      return questions.push(newQuestion);
    });
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
    return state.updateIn([action.thematicId, 'questions'], (questions) => {
      return questions.remove(action.index);
    });
  case 'UPDATE_QUESTION_TITLE':
    return state.updateIn([action.thematicId, 'questions', action.index, 'titleEntries'], (titleEntries) => {
      const titleEntryIndex = titleEntries.findIndex((entry) => {
        return entry.get('localeCode') === action.locale;
      });

      if (titleEntryIndex === -1) {
        return titleEntries.push(Map({ localeCode: action.locale, value: action.value }));
      }

      return titleEntries.setIn([titleEntryIndex, 'value'], action.value);
    });
  case 'UPDATE_THEMATIC_IMG_URL':
    return state.setIn([action.id, 'img', 'externalUrl'], action.value);
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

export const thematicsHaveChanged = (state = false, action) => {
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

const hasLocale = (l, arr) => {
  const i = arr.findIndex((a) => {
    return a === l;
  });
  return i >= 0;
};

export const languagePreferences = (state = List(), action) => {
  switch (action.type) {
  case 'ADD_LANGUAGE_PREFERENCE':
    // Language preferences can be added in different components
    if (!hasLocale(action.locale, state)) {
      return state.push(action.locale);
    }
    return state;
  case 'REMOVE_LANGUAGE_PREFERENCE':
    if (hasLocale(action.locale, state)) {
      const i = state.findIndex((a) => {
        return a === action.locale;
      });
      return state.delete(i);
    }
    return state;
  default:
    return state;
  }
};

export const discussionLanguagePreferencesHasChanged = (state = false, action) => {
  switch (action.type) {
  case 'LANGUAGE_PREFERENCE_HAS_CHANGED':
    return action.state;
  default:
    return state;
  }
};

export default combineReducers({
  selectedLocale: selectedLocale,
  thematicsHaveChanged: thematicsHaveChanged,
  thematicsInOrder: thematicsInOrder,
  thematicsById: thematicsById,
  discussionLanguagePreferences: languagePreferences,
  discussionLanguagePreferencesHasChanged: discussionLanguagePreferencesHasChanged,
  resourcesCenter: resourcesCenter
});