import { combineReducers } from 'redux';

export const selectedLocale = (state = 'fr', action) => {
  switch (action.type) {
  case 'UPDATE_SELECTED_LOCALE':
    return action.newLocale;
  default:
    return state;
  }
};

export const surveyThemes = (state = [], action) => {
  switch (action.type) {
  case 'ADD_THEME_TO_SURVEY':
    return [...state, action.id];
  default:
    return state;
  }
};

export const surveyThemesById = (state = {}, action) => {
  switch (action.type) {
  case 'ADD_THEME_TO_SURVEY':
    return {
      ...state,
      [action.id]: {
        titlesByLocale: {},
        image: null
      }
    };
  case 'UPDATE_SURVEY_THEME_TITLE': {
    const newState = { ...state };
    newState[action.themeId].titlesByLocale[action.locale] = action.newTitle;
    return newState;
  }
  default:
    return state;
  }
};

export default combineReducers({
  selectedLocale: selectedLocale,
  surveyThemes: surveyThemes,
  surveyThemesById: surveyThemesById
});