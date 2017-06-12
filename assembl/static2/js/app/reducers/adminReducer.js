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

export default combineReducers({
  selectedLocale: selectedLocale,
  thematicsToDelete: thematicsToDelete
});