import { combineReducers } from 'redux';

export const selectedLocale = (state = 'fr', action) => {
  switch (action.type) {
  case 'UPDATE_SELECTED_LOCALE':
    return action.newLocale;
  default:
    return state;
  }
};

export const thematicsToDelete = (state = [], action) => {
  switch (action.type) {
  case 'LIST_THEMATICS_TO_DELETE':
    return action.thematicsToDelete;
  default:
    return state;
  }
};

// export const surveyThemes = (state = [], action) => {
//   switch (action.type) {
//   case 'ADD_THEME_TO_SURVEY':
//     return [...state, action.id];
//   case 'REMOVE_SURVEY_THEME':
//     return [...state.slice(0, state.indexOf(action.id)), ...state.slice(state.indexOf(action.id) + 1)];
//   default:
//     return state;
//   }
// };

// export const surveyThemesById = (state = {}, action) => {
//   switch (action.type) {
//   case 'ADD_THEME_TO_SURVEY':
//     return {
//       ...state,
//       [action.id]: {
//         titlesByLocale: {},
//         image: undefined
//       }
//     };
//   case 'REMOVE_SURVEY_THEME': {
//     const newState = { ...state };
//     delete newState[action.id];
//     return newState;
//   }
//   case 'UPDATE_SURVEY_THEME_TITLE': {
//     const newState = { ...state };
//     newState[action.themeId].titlesByLocale[action.locale] = action.newTitle;
//     return newState;
//   }
//   case 'UPDATE_SURVEY_THEME_IMAGE': {
//     const newState = { ...state };
//     newState[action.themeId].image = action.file;
//     return newState;
//   }
//   default:
//     return state;
//   }
// };

export default combineReducers({
  selectedLocale: selectedLocale,
  thematicsToDelete: thematicsToDelete
  // surveyThemes: surveyThemes,
  // surveyThemesById: surveyThemesById
});